##Ionic 2 mobile sensor application
Authenticates with AWS Cognito, records phone location and movement, and then uploads data in CSV form to S3 

### Tech Stack
#### Required Tools
* [npm](https://www.npmjs.com/)
* [Android SDK]
* [adb]

#### Frameworks
* [AWS JavaScript SDK](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/browser-intro.html)
* [Angular 2](https://angular.io/docs/ts/latest/quickstart.html) 
* [(Ionic)](http://ionicframework.com/docs/v2/getting-started/installation/)
* [TypeScript](https://www.typescriptlang.org/docs/tutorial.html)

### Getting the code
```
# Clone it from github
git clone git@github.com:paulcockrell/ionicaccelapp.git
```
```
# Install the NPM and Bower packages
npm install
```

```
# Install Ionic and Cordova packages
npm install -g ionic cordova
```

```
# ionic state restore
```

```
# Build & Run the app in dev mode
ionic build android
ionic run android --device
```

```
# Build & Run the app in prod mode
ionic build android
ionic run android --prod --device
```

### AWS Setup
You will need to create the user pool manually through the console. 

1. Create User pool first, when creating the app for the pool DO NOT check "Generate client secret" It
does not work with the JavaScript SDK.

2. Create a federated Identity, and "Edit identity pool", under "Authentication providers" complete
the "Cognito" entry with your app details generated in step 1.

### Necessary changes
Modify ```app/services/properties.service.ts``` file to reflect your own AWS specific settings

