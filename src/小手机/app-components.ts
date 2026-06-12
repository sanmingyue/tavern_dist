import type { Component } from 'vue';

import BrowserApp from './apps/Browser/App.vue';
import CalculatorApp from './apps/Calculator/App.vue';
import CalendarApp from './apps/Calendar/App.vue';
import CameraApp from './apps/Camera/App.vue';
import ChatApp from './apps/Chat/App.vue';
import ClockApp from './apps/Clock/App.vue';
import ContactsApp from './apps/Contacts/App.vue';
import DeliveryApp from './apps/Delivery/App.vue';
import FilesApp from './apps/Files/App.vue';
import ForumApp from './apps/Forum/App.vue';
import GalleryApp from './apps/Gallery/App.vue';
import MapApp from './apps/Map/App.vue';
import MessagesApp from './apps/Messages/App.vue';
import MovieApp from './apps/Movie/App.vue';
import MusicApp from './apps/Music/App.vue';
import NotesApp from './apps/Notes/App.vue';
import NotificationsApp from './apps/Notifications/App.vue';
import PhoneApp from './apps/Phone/App.vue';
import SettingsApp from './apps/Settings/App.vue';
import ShopApp from './apps/Shop/App.vue';
import SmsApp from './apps/SMS/App.vue';
import TaxiApp from './apps/Taxi/App.vue';
import ThemesApp from './apps/Themes/App.vue';
import VideoApp from './apps/Video/App.vue';
import WalletApp from './apps/Wallet/App.vue';
import WeatherApp from './apps/Weather/App.vue';

export const APP_COMPONENTS: Record<string, Component> = {
  browser: BrowserApp,
  calculator: CalculatorApp,
  calendar: CalendarApp,
  camera: CameraApp,
  chat: ChatApp,
  clock: ClockApp,
  contacts: ContactsApp,
  delivery: DeliveryApp,
  files: FilesApp,
  forum: ForumApp,
  gallery: GalleryApp,
  map: MapApp,
  messages: MessagesApp,
  movie: MovieApp,
  music: MusicApp,
  notes: NotesApp,
  notifications: NotificationsApp,
  phone: PhoneApp,
  settings: SettingsApp,
  shop: ShopApp,
  sms: SmsApp,
  taxi: TaxiApp,
  themes: ThemesApp,
  video: VideoApp,
  wallet: WalletApp,
  weather: WeatherApp,
};
