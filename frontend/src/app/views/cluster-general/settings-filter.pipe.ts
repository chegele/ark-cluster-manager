
import { Pipe, PipeTransform} from '@angular/core';
import { Property } from 'src/app/models/database/setting';

@Pipe({name: 'settingsFilter'})
export class SettingsFilterPipe implements PipeTransform {

    transform(settings: Property[], category: string) {
        return settings.filter(setting => setting.category == category);
    }

}