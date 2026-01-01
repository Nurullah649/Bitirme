# ==========================================
# 1. KURULUM VE KÜTÜPHANELER
# ==========================================
# Unsloth kütüphanesini kuruyoruz (Eğitimi 2x hızlandırır, %60 az hafıza harcar)
#%%capture
#!pip install unsloth
# Google Colab için gerekli ek paketler
#!pip install --no-deps "xformers<0.0.27" "trl<0.9.0" peft accelerate bitsandbytes

import torch
from unsloth import FastLanguageModel
from datasets import load_dataset
from trl import SFTTrainer
from transformers import TrainingArguments

# ==========================================
# 2. MODELİN YÜKLENMESİ
# ==========================================
max_seq_length = 2048 # Tarım verileri ve geçmiş yıl analizleri uzun olabilir
dtype = None # None yaparsak otomatik algılar (Float16)
load_in_4bit = True # VRAM tasarrufu için 4-bit yükleme (Eğitim için şart)

print("🚀 Model yükleniyor: Qwen/Qwen2.5-1.5B-Instruct...")
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "Qwen/Qwen2.5-1.5B-Instruct", # Zeki ve hafif modelimiz
    max_seq_length = max_seq_length,
    dtype = dtype,
    load_in_4bit = load_in_4bit,
)

# Modeli LoRA (Low-Rank Adaptation) için hazırlıyoruz
# Modelin tamamını değil, sadece %1-%5'lik kısmını eğiterek "Ziraat Mühendisi" yapacağız.
model = FastLanguageModel.get_peft_model(
    model,
    r = 16, # Rank: Ne kadar detay öğreneceği (16 idealdir)
    target_modules = ["q_proj", "k_proj", "v_proj", "o_proj",
                      "gate_proj", "up_proj", "down_proj"],
    lora_alpha = 16,
    lora_dropout = 0,
    bias = "none",
    use_gradient_checkpointing = "unsloth", 
    random_state = 3407,
    use_rslora = False,
    loftq_config = None,
)

# ==========================================
# 3. VERİ SETİ VE GÜÇLÜ PROMPT (ÇİFTÇİ PERSONASI)
# ==========================================

# BURASI ÇOK ÖNEMLİ: Modele kim olduğunu öğrettiğimiz yer.
alpaca_prompt = """Sen Şanlıurfa bölgesinde uzmanlaşmış, 30 yıllık deneyime sahip Kıdemli Ziraat Mühendisi 'Çiftçi AI'sın.
Aşağıda bir çiftçinin sorusu (Instruction) ve tarlanın o anki durumuyla ilgili teknik veriler (Input) bulunmaktadır.

Görevin:
1. Sana verilen meteorolojik verileri (Sıcaklık, Yağış) ve tarihi analiz et.
2. Çiftçiye samimi, güven veren ve "bizden biri" gibi konuşan bir dille cevap ver.
3. Sadece "uygun" veya "değil" deme; nedenini bilimsel ama basit bir dille açıkla.
4. Geçmiş yılların verim verilerini (varsa) referans alarak tavsiyede bulun.

### Instruction:
{}

### Input:
{}

### Response:
{}"""

EOS_TOKEN = tokenizer.eos_token # Cümle bitti sinyali

def formatting_prompts_func(examples):
    instructions = examples["instruction"]
    inputs       = examples["input"]
    outputs      = examples["output"]
    texts = []
    for instruction, input, output in zip(instructions, inputs, outputs):
        # Promptu dolduruyoruz ve sonuna EOS token ekliyoruz
        text = alpaca_prompt.format(instruction, input, output) + EOS_TOKEN
        texts.append(text)
    return { "text" : texts, }

# Veri setini yükle (Colab'in sol tarafına dosyanı yüklediğinden emin ol)
dataset_file = "gercek_api_egitim_verisi_ai.jsonl" 

print(f"📂 Veri seti işleniyor: {dataset_file}")
dataset = load_dataset("json", data_files = dataset_file, split = "train")
dataset = dataset.map(formatting_prompts_func, batched = True)

# ==========================================
# 4. EĞİTİM AYARLARI (TRAINING)
# ==========================================
trainer = SFTTrainer(
    model = model,
    tokenizer = tokenizer,
    train_dataset = dataset,
    dataset_text_field = "text",
    max_seq_length = max_seq_length,
    dataset_num_proc = 2,
    packing = False, 
    args = TrainingArguments(
        per_device_train_batch_size = 2, # T4 GPU için güvenli değer
        gradient_accumulation_steps = 4, # 2x4 = 8 batch size gibi davranır
        warmup_steps = 5,
        num_train_epochs = 1, # 5000 veri için 1 tur yeterlidir (Ezberlememesi için)
        learning_rate = 2e-4, # Standart ince ayar hızı
        fp16 = not torch.cuda.is_bf16_supported(),
        bf16 = torch.cuda.is_bf16_supported(),
        logging_steps = 10,
        optim = "adamw_8bit", # VRAM dostu optimizer
        weight_decay = 0.01,
        lr_scheduler_type = "linear",
        seed = 3407,
        output_dir ="models/outputs",
    ),
)

print("🚜 Eğitim başlıyor... Arkanıza yaslanın.")
trainer_stats = trainer.train()

# ==========================================
# 5. MODELİ KAYDETME VE GGUF DÖNÜŞÜMÜ
# ==========================================
print("💾 Eğitim bitti! Model GGUF formatına dönüştürülüyor...")

# Sunucunuzdaki 4GB RAM'de çalışması için 'q4_k_m' formatına sıkıştırıyoruz.
# Bu işlem biraz zaman alabilir.
model.save_pretrained_gguf("CiftciAI_Model", tokenizer, quantization_method = "q4_k_m")

print("✅ İŞLEM TAMAMLANDI!")
print("Sol taraftaki 'CiftciAI_Model' klasöründeki .gguf dosyasını indirip sunucunuza atabilirsiniz.")
