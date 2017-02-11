# Cloning this repo:
```
git clone ssh://git@bitbucket.org/paulcockrell/ionicaccelapp.git
```

# Install
```
cd <path/to/app>
npm install
npm install -g typings
typings install dt~cordova --save --global 
typings install dt~cordova/plugins/filesystem --save  --global
ionic platform add android
```

# Debugging

To debug application running on a device open Chrome and navigate to
```
chrome://inspect/#device
```
You can select the device to inspec from the list using regular chrome debug tools

# Installing plugins

This installs and also updates the package.json file. You must have already
installed your target builds (i.e android)

```
ionic plugin add cordova-plugin-geolocation --save
ionic state save
```

# Integration AWS IOT
see the following git repo: https://github.com/vbudilov/aws-cognito-ionic2

# Run application
```
ionic run android --device
```

# List devices connected to machine
To see which mobile devices are available to deploy to from your host machine
```
adb devices
```
