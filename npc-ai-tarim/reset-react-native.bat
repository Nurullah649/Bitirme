@echo off
echo ===============================
echo  React Native Temizlik Scripti
echo ===============================

echo 1) node_modules klasörü siliniyor...
rd /s /q node_modules

echo 2) lock dosyaları siliniyor...
del /f /q package-lock.json
del /f /q yarn.lock

echo 3) NPM paketleri tekrar yükleniyor...
npm install

echo 4) Metro cache temizleniyor...
npx react-native start --reset-cache

echo 5) Android build temizleniyor...
cd android
call gradlew clean
cd ..

echo 6) Android uygulama yeniden build ediliyor...
npx react-native run-android

echo ===============================
echo  İşlem tamamlandı!
echo ===============================
pause
