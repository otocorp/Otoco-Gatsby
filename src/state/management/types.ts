export const SET_OWN_SERIES = 'SET_OWN_SERIES'
export const SET_MANAGE_SERIES = 'SET_MANAGE_SERIES'
export const CLEAR_MANAGE_SERIES = 'CLEAR_MANAGE_SERIES'
export const SET_MANAGE_SECTION = 'SET_MANAGE_SECTION'
export const SET_CONTACT_FORM = 'SET_CONTACT_FORM'

export enum ManageSection {
  LEGAL = 'legal',
  TOKEN = 'token',
  ENS = 'ens',
  MULTISIG = 'multisig',
  PLUGINS = 'plugins',
  MANAGE = 'manage',
}

export enum Badges {
  FIRST = 'First Member',
  MANAGEMENT = 'Manager',
}

export type SeriesType = {
  contract: string
  name: string
  jurisdiction: string
  created: Date
  owner: string
  badges: Badges[]
}

interface SetOwnSeries {
  type: typeof SET_OWN_SERIES
  payload: SeriesType[]
}
interface SetManageSeries {
  type: typeof SET_MANAGE_SERIES
  payload: SeriesType
}
interface ClearManageSeries {
  type: typeof CLEAR_MANAGE_SERIES
}
interface SetManageSection {
  type: typeof SET_MANAGE_SECTION
  payload: ManageSection | undefined
}
interface SetContactForm {
  type: typeof SET_CONTACT_FORM
  payload: boolean
}
export interface IManagementState {
  series: SeriesType[]
  managing?: SeriesType
  contactForm: boolean
  section?: ManageSection
}

export type ManagementActionTypes =
  | SetOwnSeries
  | SetManageSeries
  | ClearManageSeries
  | SetManageSection
  | SetContactForm
