import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Platform, ToastController } from 'ionic-angular';
import { AwsUtil } from "../../providers/aws.service";
import { Sensors, IDataObj } from "../../providers/sensors.service";
import { LocalNotifications } from 'ionic-native';

declare var cordova: any;

@Component({
  selector: 'page-device-motion',
  templateUrl: 'device-motion.html'
})
export class DeviceMotionPage {
  tripTypes: Array<Object> = new Array({id: 0, name: 'walking'}, {id: 1, name: 'driving'}, {id: 2, name: 'stationary'});
  sampleRates: Array<number> = new Array(10, 20, 30);
  recordTimeouts: Array<number> = new Array(10, 20, 30, 40, 50, 60);
  isRecording: Boolean = false;
  submitAttempt: Boolean = false;
  recordForm: FormGroup;
  timer: number = 0;
  logWriterInterval: any;
  ready: Boolean = false;
  data: Array<string> = new Array();

  constructor(
    private platform: Platform,
    public formBuilder: FormBuilder,
    private toastCtrl: ToastController,
    public awsUtil: AwsUtil,
    private sensors: Sensors
  ) {

    this.recordForm = formBuilder.group({
      sampleRate: ["", this.isValidSampleRate.bind(this)],
      recordTimeout: ["", this.isValidRecordTimeout.bind(this)],
      tripType: ["", this.isValidTripType.bind(this)]
    });

    platform
      .ready()
      .then(() => {
        // Device sensors will be ready
        this.ready = true;
        // Geolocation doesn't work on a frequency, but rather location change event
        sensors.startGeolocation();
      });

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

    let sensor_data = this.sensors.data();
    if (!sensor_data.geolocation && !sensor_data.geolocation.coords) {
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

    this.sensors.startAcceleration(sampleRate);
    this.sensors.startCompass(sampleRate);

    this.isRecording = true;
    this.data.push(this.generateHeader());

    // Sensor warmup pause
    setTimeout(() => {
      this.runTimer(recordTimeout);
      this.logWriterInterval = setInterval(_ => {
        if (!this.isRecording) return;

        let sensor_data = this.sensors.data();
        let csv_data = this.sensorDataToCsv(sensor_data);
        this.data.push(csv_data);
      }, sampleRate);
    }, 1000);
  }

  private sensorDataToCsv(data: IDataObj): string {
    let csv_data = 
      this.recordForm.value.tripType + ", " +
      Date.now() + "," +
      data.geolocation.coords.latitude + "," + 
      data.geolocation.coords.longitude + "," +
      data.geolocation.coords.altitude + "," +
      data.geolocation.coords.accuracy + "," +
      data.geolocation.coords.altitudeAccuracy + "," +
      data.geolocation.coords.heading + "," +
      data.geolocation.coords.speed + "," +
      data.acceleration.x + "," +
      data.acceleration.y + "," +
      data.acceleration.z + "," +
      data.compass.magneticHeading + "," +
      data.compass.trueHeading + "," +
      data.compass.headingAccuracy + "\n";

    return csv_data;
  }

  runTimer(ticks: number): void {
    this.timer = ticks;

    if (ticks <= 0) {
      this.isRecording = false; 
      clearInterval(this.logWriterInterval); 

      this.sensors.stopAcceleration();
      this.sensors.stopCompass();

      this.awsUtil.uploadFile(this.recordForm.value.tripType, this.data.join(""), () => {
        this.showToast("File uploaded to S3");

        // Schedule a single notification
        // This is really a functionality test, we will use this later
        // when the app is running live and we determine the users motions changes
        // i.e stationairy->walking->driving etc
        LocalNotifications.schedule({
          id: 1,
          text: 'S3 upload completed',
          sound: this.platform.is('android') ? 'file://sound.mp3': 'file://beep.caf',
          data: { secret: 1234 }
        });
      });
    }
    else {
      setTimeout(() => {
        this.runTimer(ticks - 1);
      }, 1000);
    }
  }

  private showToast(message: string): void {
    let toast = this.toastCtrl.create({
      message: message,
      duration: 3000,
      position: "top"
    });
    toast.present();
  }

  private generateHeader(): string {
    let header = 
      "# Trip type (0: walking, 1: driving, 2: stationairy): " + this.recordForm.value.tripType + 
      "\n# Sample rate: " + this.recordForm.value.sampleRate + 
      "\n# Record time (s): " + this.recordForm.value.recordTimeout +
      "\ntriptype, timestamp, latitue, longitude, altitude, accuracy " +
      "altitude accuracy, heading, speed, accelx, accely, accelz, " +
      "magnetic heading, true heading, heading accuracy" +
      "\n";

    return header;
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

  ngOnDestroy() {
    this.sensors.stopGeolocation();
    this.sensors.stopAcceleration();
    this.sensors.stopCompass();
  }

}
