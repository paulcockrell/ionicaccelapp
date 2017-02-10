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
