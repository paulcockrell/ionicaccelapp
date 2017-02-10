echo "Installing nodejs, ionic and cordova..."
curl -sL https://deb.nodesource.com/setup_7.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo apt-get install -y build-essential
npm install -g ionic cordova
echo "Complete"

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
