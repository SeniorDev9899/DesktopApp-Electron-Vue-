import { settingAction } from '@/store/setting';
import { IService } from "@/core/services";
export class SettingService implements IService {
  constructor() {
  }
  onMeetingStart(): void {
    settingAction.loadStorage()
  }
  onMeetingEnd(): void {
  }
  onLogout(): void {

  }
}