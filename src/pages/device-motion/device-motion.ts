import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Platform, ToastController } from 'ionic-angular';
import { Geolocation } from 'ionic-native';
import { DeviceMotion } from 'ionic-native';
import { File } from 'ionic-native';

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
  private watchAcceleration;
  private watchGeolocation;
  private acceleration;
  private pos;
  private tripTypes: Array<string> = new Array("walking", "driving");
  private sampleRates: Array<number> = new Array(10, 20, 30);
  private recordTimeouts: Array<number> = new Array(10, 20, 30, 40, 50, 60);
  private isRecording: Boolean = false;
  private submitAttempt: Boolean = false;
  private recordForm: FormGroup;
  private timer: number = 0;
  private fs:string = cordova.file.dataDirectory;
  private logWriterInterval: any;

  constructor(
    private platform: Platform,
    public formBuilder: FormBuilder,
    private toastCtrl: ToastController,
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
      });

  }

  removeCsv(): void {
    File
      .removeFile(this.fs, 'afile.csv')
      .then(_ => {})
      .catch((err) => {
        console.log("Failed to remove file", err);
      });
  }

  readCsv(cb: any): void {
    File.readAsText(this.fs, 'afile.csv')
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
      this.isRecording = true;
      this.runTimer(this.recordForm.value.recordTimeout);
      this.logWriterInterval = setInterval(_ => {
        this.writeToCsv();
      }, 1000);
    }
  }

  runTimer(ticks: number): void {
    this.timer = ticks;

    if (ticks <= 0) {
      this.isRecording = false; 
      clearInterval(this.logWriterInterval); 
      this.readCsv((data) => {
        console.log("File data:", data);
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

    File.writeFile(this.fs, 'afile.csv', data, {append: true})
      .then(
        _ => {
          console.log("Written to log");
        }
      ).catch(
        (err) => {
          if (err.code == 1) // NOT_FOUND_ERR
            File.writeFile(this.fs, 'afile.csv', data)
              .then(
                _ => {
                  console.log("Created and written to log");
                }
              ).catch(
                (err) => {
                  console.log("Error creating file", err);
                }
              );
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
