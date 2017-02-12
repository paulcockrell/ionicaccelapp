import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Platform, ToastController } from 'ionic-angular';
import { Geolocation } from 'ionic-native';
import { DeviceMotion } from 'ionic-native';
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
  watchAcceleration;
  watchGeolocation;
  acceleration;
  pos;
  tripTypes: Array<string> = new Array("walking", "driving", "stationary");
  sampleRates: Array<number> = new Array(10, 20, 30);
  recordTimeouts: Array<number> = new Array(10, 20, 30, 40, 50, 60);
  isRecording: Boolean = false;
  submitAttempt: Boolean = false;
  recordForm: FormGroup;
  timer: number = 0;
  fs:string = cordova.file.dataDirectory;
  logWriterInterval: any;
  fileName: string;

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
        this.watchGeolocation = Geolocation
          .watchPosition()
          .subscribe((pos) => {
            this.pos = pos;
          });

        this.watchAcceleration = DeviceMotion
          .watchAcceleration({frequency: 200})
          .subscribe((acceleration) => {
            this.acceleration = acceleration;
          });
        this.removeCsv();
      });

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
    }
    else {
      let recordTimeout = this.recordForm.value.recordTimeout;
      let sampleRate = this.recordForm.value.sampleRate;

      this.isRecording = true;
      this.fileName = this.generateFileName();
      console.log("Recording to: " + this.fs + "/" + this.fileName);
      this.runTimer(recordTimeout);
      this.logWriterInterval = setInterval(_ => {
        this.writeToCsv();
      }, sampleRate);
    }
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
    if (this.tripTypes.indexOf(control.value) < 0) {
      return {
        "Please select trip type": true
      }
    }

    return null;
  }

  private writeToCsv(): void {
    let data = this.pos.coords.latitude + "," + this.pos.coords.longitude + "," + this.acceleration.x + "," + this.acceleration.y + "," + this.acceleration.z + "\n";

    File.writeFile(this.fs, this.fileName, data, {append: true})
      .then(
        _ => {
          console.log("Written to log");
        }
      ).catch(
        (err) => {
          if (err.code == 1) {// NOT_FOUND_ERR
            let header = 
              "# Trip type: " + this.recordForm.value.tripType + 
              "\n# Sample rate: " + this.recordForm.value.sampleRate + 
              "\n# Record time (s): " + this.recordForm.value.recordTimeout +
              "\n# latitue, longitude, accelx, accely, accelz" +
              "\n" + data;

            File.writeFile(this.fs, this.fileName, header, {append: false})
              .then(
                _ => {
                  console.log("Created and written to log");
                }
              ).catch(
                (err) => {
                  console.log("Error creating file", err);
                }
              );
          }
          else
            console.log("Error creating file", err);
        }
      );
  }

  ngOnDestroy() {
    this.watchGeolocation.unsubscribe();
    this.watchAcceleration.unsubscribe();
  }

}
