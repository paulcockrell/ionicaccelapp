import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Platform, ToastController } from 'ionic-angular';
import { Geolocation } from 'ionic-native';
import { DeviceMotion } from 'ionic-native';

@Component({
  selector: 'page-device-motion',
  templateUrl: 'device-motion.html'
})
export class DeviceMotionPage {
  private watchAcceleration;
  private watchGeolocation;
  private acceleration;
  private pos;
  private tripTypes: Array<string>;
  private sampleRates: Array<Number>;
  private recordTimeouts: Array<Number>;
  private isRecording: Boolean;
  private submitAttempt: Boolean = false
  private recordForm: FormGroup;

  constructor(private platform: Platform, public formBuilder: FormBuilder, private toastCtrl: ToastController) {

    this.tripTypes = new Array("walking", "driving");
    this.sampleRates = new Array(10, 20, 30);
    this.recordTimeouts = new Array(10, 20, 30, 40, 50, 60);
    this.isRecording = false;
    this.recordForm = formBuilder.group({
      sampleRate: ["", this.isValidSampleRate],
      recordTimeout: ["", this.isValidRecordTimeout],
      tripType: ["", this.isValidTripType]
    });

    platform.ready().then(() => {
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

  startRecording($event) {
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
    }
  }

  isValidSampleRate(control: FormControl): any {
    console.log("err hello?", this.sampleRates);
    if (this.sampleRates.indexOf(control.value) > -1) {
      return {
        "Please select sample rate": true
      }
    }

    return null;
  }

  isValidRecordTimeout(control: FormControl): any {
    if (this.recordTimeouts.indexOf(control.value) > -1) {
      return {
        "Please select record timeout": true
      }
    }

    return null;
  }

  isValidTripType(control: FormControl): any {
            if (this.tripTypes.indexOf(control.value) > -1) {
      return {
        "Please select trip type": true
      }
    }

    return null;
  }

  ngOnDestroy() {
    this.watchGeolocation.unsubscribe();
    this.watchAcceleration.unsubscribe();
  }

}
