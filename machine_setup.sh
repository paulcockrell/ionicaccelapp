echo "Installing nodejs, ionic and cordova..."
curl -sL https://deb.nodesource.com/setup_7.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo apt-get install -y build-essential
npm install -g ionic cordova
echo "Complete"

echo "You must Download Android Studio and unpack to /usr/local, then run /usr/local/android-studio/bin/..."

echo "Add Android studio to path"
echo "export ANDROID_HOME=/home/donaldtrump/Android/Sdk" >> ~/.bashrc
echo "export PATH=${PATH}:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools" >> ~/.bashrc
echo "Done"

echo "Allowing phone to connect to adb, you get the idVendor code from doing lsusb, its the first block of xxxx:xxxx (your phone will ask for permission during this procedure"
sudo echo 'SUBSYSTEM=="usb", ATTR{idVendor}=="05c6", MODE="0666", GROUP="plugdev"' > /etc/udev/rules.d/51-android.rules
sudo chmod a+r /etc/udev/rules.d/51-android.rules
sudo udevadm control  --reload-rules
sudo service udev restart 
adb devices
adb kill-server
adb start-server
adb devices
echo "Done"

echo "!!! Install Java JDK from http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html"
echo "Done"

echo "Creating tutorial app..."
ionic start MyIonic2Project tutorial --v2
echo "Complete"

pushd ./MyIonic2Project

echo "Starting tutorial app... serving to browser, ctrl-c to stop"
ionic serve
echo "Complete"

echo "Starting tutorial app... serving to androind"
echo "Installing android platform"
cordova platform add android
ionic run android --device
echo "Complete"
