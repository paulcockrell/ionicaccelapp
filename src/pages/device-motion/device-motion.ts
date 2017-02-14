import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Platform, ToastController } from 'ionic-angular';
import { Geolocation } from 'ionic-native';
import { DeviceMotion, AccelerationData } from 'ionic-native';
import { DeviceOrientation, CompassHeading } from 'ionic-native';
import { File } from 'ionic-native';
import {AwsUtil} from "../../providers/aws.service";

declare var cordova: any;

export interface IDataObj {
  pos: any,
  acceleration: any
}

@Component({
  selector: 'page-device-motion',
  templateUrl: 'device-motion.html'
})
export class DeviceMotionPage {
  watchAcceleration: any;
  watchGeolocation: any;
  watchCompass: any;
  acceleration: AccelerationData;
  compass: CompassHeading;
  pos;
  tripTypes: Array<Object> = new Array({id: 0, name: 'walking'}, {id: 1, name: 'driving'}, {id: 2, name: 'stationary'});
  sampleRates: Array<number> = new Array(10, 20, 30);
  recordTimeouts: Array<number> = new Array(10, 20, 30, 40, 50, 60);
  isRecording: Boolean = false;
  submitAttempt: Boolean = false;
  recordForm: FormGroup;
  timer: number = 0;
  fs:string = cordova.file.dataDirectory;
  logWriterInterval: any;
  fileName: string;
  ready: Boolean = false;

  constructor(
    private platform: Platform,
    public formBuilder: FormBuilder,
    private toastCtrl: ToastController,
    public awsUtil: AwsUtil
  ) {

    this.recordForm = formBuilder.group({
      sampleRate: ["", this.isValidSampleRate.bind(this)],
      recordTimeout: ["", this.isValidRecordTimeout.bind(this)],
      tripType: ["", this.isValidTripType.bind(this)]
    });

    platform
      .ready()
      .then(() => {
        // Sensors will be ready
        this.ready = true;
        // Geolocation doesn't work on a frequency, but rather location change event
        this.watchGeolocation = this.startGeolocation();
      });

  }

  startGeolocation(): any {
    if (this.ready != true) return;

    let sub = Geolocation
      .watchPosition({ maximumAge: 3000, timeout: 5000, enableHighAccuracy: true })
      .subscribe((pos) => {
        this.pos = pos;
      });

    return sub;
  }

  stopGeolocation(subscription: any): void {
    subscription.unsubscribe();
  }

  startCompass(frequency: number): any {
    if (this.ready != true) return;

    let sub = DeviceOrientation
      .watchHeading({frequency: frequency})
      .subscribe((data: CompassHeading) => {
        this.compass = data;
      });

    return sub;
  }

  stopCompass(subscription: any): void {
    subscription.unsubscribe();
  }

  startAcceleration(frequency: number): any {
    if (this.ready != true) return;

    let sub = DeviceMotion
      .watchAcceleration({frequency: frequency})
      .subscribe((acceleration: AccelerationData) => {
        this.acceleration = acceleration;
      });

    return sub; 
  }

  stopAcceleration(subscription: any): void {
    subscription.unsubscribe();
  }

  removeCsv(): void {
    File
      .removeFile(this.fs, "afile.csv")
      .then(_ => {})
      .catch((err) => {
        console.log("Failed to remove file", err);
      });
  }

  readCsv(cb: any): void {
    File.readAsText(this.fs, this.fileName)
      .then(
        (data) => {
          cb(data);
        }
      ).catch(
        (err) => {
          console.log("Problem reading file:", err);
          cb(null);
        }
      );
  }

  startRecording($event): void {
    if (this.isRecording) return;

    this.submitAttempt = true;

    if (!this.recordForm.valid) {
      this.isRecording = false;
      let toast = this.toastCtrl.create({
        message: "Please complete form",
        duration: 3000,
        position: "top"
      });
      toast.present();
      
      return;
    }

    if (!this.pos && !this.pos.coords) {
      this.isRecording = false;
      let toast = this.toastCtrl.create({
        message: "Waiting for geolocation lock",
        duration: 3000,
        position: "top"
      });
      toast.present();
      
      return;
    }

    let recordTimeout = this.recordForm.value.recordTimeout;
    let sampleRate = this.recordForm.value.sampleRate;

    this.watchAcceleration = this.startAcceleration(sampleRate);
    this.watchCompass = this.startCompass(sampleRate);

    this.isRecording = true;
    this.fileName = this.generateFileName();
    console.log("Recording to: " + this.fs + "/" + this.fileName);

    this.createLog((err) => {
      if (err) {
        this.isRecording = false;
        let toast = this.toastCtrl.create({
          message: "Failed to create log file",
          duration: 3000,
          position: "top"
        });
        toast.present();
         
        return;
      }
      
      this.runTimer(recordTimeout);
      this.logWriterInterval = setInterval(_ => {
        this.writeLog();
      }, sampleRate);
    })
  }

  private generateFileName(): string {
    let tripType = this.recordForm.value.tripType;
    return tripType + "-" + Date.now() + ".csv";
  }

  runTimer(ticks: number): void {
    this.timer = ticks;

    if (ticks <= 0) {
      this.isRecording = false; 
      clearInterval(this.logWriterInterval); 

      this.stopAcceleration(this.watchAcceleration);
      this.stopCompass(this.watchCompass);

      this.readCsv((data) => {
        let tripType = this.recordForm.value.tripType;
        this.awsUtil.uploadFile(tripType, data);
      });
      let toast = this.toastCtrl.create({
        message: "Trip recording completed",
        duration: 3000,
        position: "top"
      });
      toast.present();
      return;
    }

    setTimeout(() => {
      this.runTimer(ticks - 1);
    }, 1000);
  }

  private isValidSampleRate(control: FormControl): any {
    if (this.sampleRates.indexOf(control.value) < 0) {
      return {
        "Please select sample rate": true
      }
    }

    return null;
  }

  private isValidRecordTimeout(control: FormControl): any {
    if (this.recordTimeouts.indexOf(control.value) < 0) {
      return {
        "Please select record timeout": true
      }
    }

    return null;
  }

  private isValidTripType(control: FormControl): any {
    let valid_ids = [];
    for (let trip_type_id in this.tripTypes) {
      valid_ids.push(Number(trip_type_id));
    }

    if (valid_ids.indexOf(control.value) < 0) {
      return {
        "Please select trip type": true
      }
    }

    return null;
  }

  private createLog(cb: any): void {
    let header = 
      "# Trip type (0: walking, 1: driving, 2: stationairy): " + this.recordForm.value.tripType + 
      "\n# Sample rate: " + this.recordForm.value.sampleRate + 
      "\n# Record time (s): " + this.recordForm.value.recordTimeout +
      "\n# triptype, latitue, longitude, altitude, accuracy " +
      "altitude accuracy, heading, speed, accelx, accely, accelz, " +
      "magnetic heading, true heading, heading accuracty\n";

    File.createFile(this.fs, this.fileName, true)
      .then(
        (fe) => {
          File.writeFile(this.fs, this.fileName, header, {append: true})
            .then(_ => cb(null))
            .catch(
              (err) => {
                console.log("Failed to write header to log");
                cb(err);
              }
            );
        }
      )
      .catch(
        (err) => {
          console.log("Failed to create log file");
          cb(err);
      });
  }

  private writeLog(): void {
    let data = this.recordForm.value.tripType + ", " +
               this.pos.coords.latitude + "," + 
               this.pos.coords.longitude + "," +
               this.pos.coords.altitude + "," +
               this.pos.coords.accuracy + "," +
               this.pos.coords.altitudeAccuracy + "," +
               this.pos.coords.heading + "," +
               this.pos.coords.speed + "," +
               this.acceleration.x + "," +
               this.acceleration.y + "," +
               this.acceleration.z + "," +
               this.compass.magneticHeading + "," +
               this.compass.trueHeading + "," +
               this.compass.headingAccuracy + "\n";

    File.writeFile(this.fs, this.fileName, data, {append: true})
      .then(
        _ => {
          console.log("Written to log");
        }
      ).catch(
        (err) => {
          console.log("Error writting to log", err);
        }
      );
  }

  ngOnDestroy() {
    if (this.watchGeolocation) this.stopGeolocation(this.watchGeolocation);
    if (this.watchAcceleration) this.stopAcceleration(this.watchAcceleration);
    if (this.watchCompass) this.stopCompass(this.watchCompass);
  }

}
