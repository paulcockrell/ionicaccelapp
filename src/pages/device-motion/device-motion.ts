import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
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
  

  constructor(private platform: Platform) {

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

  ngOnDestroy() {
    this.watchGeolocation.unsubscribe();
    this.watchAcceleration.unsubscribe();
  }

}
