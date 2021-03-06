import {Injectable} from "@angular/core";
import {CognitoUtil, UserLoginService} from "./cognito.service";
import {_REGION, _IDENTITY_POOL_ID, _USER_POOL_ID, _MOBILE_ANALYTICS_APP_ID, _S3_BUCKET_NAME} from "./properties.service";

declare var AWS;
declare var AWSCognito:any;
declare var AMA:any;

export class Stuff {
  public type:string;
  public date:string;
}

@Injectable()
export class AwsUtil {
  public static firstLogin:boolean = false;

  constructor(public userLogin:UserLoginService, public cUtil:CognitoUtil) {

  }

  /**
   * This is the method that needs to be called in order to init the aws global creds
   */
  initAwsService() {
    console.log("Running initAwsService()");
    AWSCognito.config.region = _REGION;
    AWS.config.region = _REGION;

    var options = {
      appId : _MOBILE_ANALYTICS_APP_ID, //Amazon Mobile Analytics App ID
    };

    var mobileAnalyticsClient = new AMA.Manager(options);
    mobileAnalyticsClient.submitEvents();

    // First check if the user is authenticated already
    let mythis = this;
    this.userLogin.isAuthenticated({
      isLoggedInCallback(message:string, loggedIn:boolean) {
        mythis.setupAWS(loggedIn);
      }
    });
  }


  /**
   * Sets up the AWS global params
   *
   * @param isLoggedIn
   * @param callback
   */
  setupAWS(isLoggedIn:boolean):void {
    console.log("in setupAWS()");
    let mythis = this;
    if (isLoggedIn) {
      console.log("User is logged in");
      this.cUtil.getIdToken({
        callback() {
        },
        callbackWithParam(idToken:any) {
          console.log("idJWT Token: " + idToken);
          mythis.addCognitoCredentials(idToken);
        }
      });
      console.log("Retrieving the id token");
    }
    else {
      console.log("User is not logged in. ");
      AWSCognito.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: _IDENTITY_POOL_ID
      });
    }
  }

  addCognitoCredentials(idTokenJwt:string):void {
    console.log("in addCognitoCredentials");
    let params = this.getCognitoParametersForIdConsolidation(idTokenJwt);

    AWS.config.credentials = new AWS.CognitoIdentityCredentials(params);
    AWSCognito.config.credentials = new AWS.CognitoIdentityCredentials(params);

    console.log("Getting the credentials class");
    // AWS.config.credentials.get(function (err) {
    //   if (!err) {
    //
    //   }
    // });
  }

  getCognitoParametersForIdConsolidation(idTokenJwt:string):{} {
    console.log("enter getCognitoParametersForIdConsolidation()");
    let url = 'cognito-idp.' + _REGION.toLowerCase() + '.amazonaws.com/' + _USER_POOL_ID;
    console.log("ur: " + url);
    let logins:Array<string> = [];
    logins[url] = idTokenJwt;
    let params = {
      IdentityPoolId: _IDENTITY_POOL_ID, /* required */
      Logins: logins
    };

    return params;
  }

  uploadFile(file_prefix: string, data: string, cb: any): void {
    console.log("in uploadFile()");
    // Following is a hack to make sure S3 uploads always work
    // http://stackoverflow.com/questions/37259824/user-pools-for-amazon-cognito-credentialserror-missing-credentials-in-config
    AWSCognito.config.update({accessKeyId: 'anything', secretAccessKey: 'anything'})
    let bucketName = _S3_BUCKET_NAME;
    let remoteFileName = file_prefix + "-" + Date.now() + ".csv";
    let s3 = new AWS.S3({
      apiVersion: '2006-03-01',
      params: {Bucket: bucketName}
    });

    s3.upload({Body: data, Key: remoteFileName}, (err, data) => {
      if(err) console.log("S3 upload error", err);
      else {
        console.log("S3 upload complete");
        cb();
      }
    });
  }

}

