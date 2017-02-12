##AWS Cognito with Ionic2 Quickstart

### Updates
10/14 -- Updated to Angular Final/Ionic RC0

### What does this app do?
Quickly start using AWS Cognito and Ionic2

### Tech Stack
#### Required Tools
* [npm](https://www.npmjs.com/)

#### Frameworks
* [AWS JavaScript SDK](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/browser-intro.html)
* [Angular 2](https://angular.io/docs/ts/latest/quickstart.html) 
* [(Ionic)](http://ionicframework.com/docs/v2/getting-started/installation/)
* [TypeScript](https://www.typescriptlang.org/docs/tutorial.html)

### Getting the code
```
# Clone it from github
git clone --depth 1 git@github.com:vbudilov/aws-cognito-ionic2.git
```
```
# Install the NPM and Bower packages
npm install
```
```
# Build & Run the app in dev mode
ionic build; ionic serve
```

### AWS Setup
You will need to create the user pool manually through the console. 

1. Create User pool first, when creating the app for the pool DO NOT check "Generate client secret" It
does not work with the JavaScript SDK.

2. Create a federated Identity, and "Edit identity pool", under "Authentication providers" complete
the "Cognito" entry with your app details generated in step 1.

### Necessary changes
By default, this app is using my user pool, which is defined in the ```app/services/properties.service.ts``` file. 
Update the file with the appropriate user pool info that you want to use 

