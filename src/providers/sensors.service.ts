import { Injectable } from '@angular/core';
import { Geolocation } from 'ionic-native';
import { DeviceMotion, AccelerationData } from 'ionic-native';
import { DeviceOrientation, CompassHeading } from 'ionic-native';

declare var cordova: any;

export interface IDataObj {
  geolocation: any,
  acceleration: any,
  compass: any
}

@Injectable()
export class Sensors {

  private watchAcceleration: any;
  private watchGeolocation: any;
  private watchCompass: any;
  private acceleration: AccelerationData;
  private compass: CompassHeading;
  private geolocation: any;

  constructor( ) { }

  startGeolocation(): void {
    this.watchGeolocation = Geolocation
      .watchPosition({ maximumAge: 3000, timeout: 5000, enableHighAccuracy: true })
      .subscribe((geolocation) => {
        this.geolocation = geolocation;
      });
  }

  stopGeolocation(): void {
    this.geolocation = null;
    if (this.watchGeolocation) this.watchGeolocation.unsubscribe();
  }

  startCompass(frequency: number): any {
    this.watchCompass = DeviceOrientation
      .watchHeading({frequency: frequency})
      .subscribe((data: CompassHeading) => {
        this.compass = data;
      });
  }

  stopCompass(): void {
    this.compass = null;
    if (this.watchCompass) this.watchCompass.unsubscribe();
  }

  startAcceleration(frequency: number): any {
    this.watchAcceleration = DeviceMotion
      .watchAcceleration({frequency: frequency})
      .subscribe((acceleration: AccelerationData) => {
        this.acceleration = acceleration;
      });
  }

  stopAcceleration(): void {
    this.acceleration = null;
    if (this.watchAcceleration) this.watchAcceleration.unsubscribe();
  }

  data(): IDataObj {
    return {
      acceleration: this.acceleration || this.blank_acceleration(),
      compass: this.compass || this.blank_compass(),
      geolocation: this.geolocation || this.blank_geolocation()
    }
  }

  private blank_geolocation(): Object {
    return {
      coords: {
        latitude: null,
        longitude: null,
        altitude: null,
        accuracy: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      }
    }
  }

  private blank_acceleration(): Object {
    return {
      x: null,
      y: null,
      z: null
    }
  }

  private blank_compass(): Object {
    return {
      magneticHeading: null,
      trueHeading: null,
      headingAccuracy: null
    }
  }
}
