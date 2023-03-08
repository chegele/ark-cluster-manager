
const component : string = "config-setting";
import { Component, Input, OnInit } from '@angular/core';
import { Property } from 'src/app/models/database/setting';

@Component({
  selector: component,
  templateUrl: `./${component}.template.html`,
  styleUrls: [ `./${component}.style.css` ],
})
export class ConfigSettingComponent implements OnInit {

  @Input() setting: Property;
  protected label: string;
  protected value: string;
  protected title: string;

  ngOnInit() {
    this.deconstructSetting();
  }

  private deconstructSetting() {
    let {label, value, key, type, description} = this.setting;
    if (!label || label == "") if (key && key != "") label = this.setting.key;
    if (type == 'Boolean') value = value ? "YES" : "NO";
    if (label.toLowerCase().includes("multiplier") && type == "Number") {
      const percent = value * 100;
      const rounded = Math.round((percent + Number.EPSILON) * 100) / 100;
      value = rounded + "%";
    }
    if (type == "Number") value = this.addCommas(value);
    this.label = label;
    this.value = value;
    this.title = description;
  }

  private addCommas(val: string | number){
    while (/(\d+)(\d{3})/.test(val.toString())){
      val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
    }
    return val;
  }

}
