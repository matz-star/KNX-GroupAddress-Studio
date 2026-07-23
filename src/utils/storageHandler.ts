import { GroupAddress } from '../types/GroupAddress';

const PROJECT_NAME_KEY = 'knx-group-address-studio:project-name';
const GROUP_ADDRESSES_KEY = 'knx-group-address-studio:group-addresses';

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const loadProjectName = () => {
  if (!canUseStorage()) {
    return 'KNX Project';
  }

  return window.localStorage.getItem(PROJECT_NAME_KEY)?.trim() || 'KNX Project';
};

export const saveProjectName = (projectName: string) => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(PROJECT_NAME_KEY, projectName.trim() || 'KNX Project');
};

export const loadGroupAddresses = (): GroupAddress[] => {
  if (!canUseStorage()) {
    return [];
  }

  const storedValue = window.localStorage.getItem(GROUP_ADDRESSES_KEY);

  if (!storedValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(storedValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveGroupAddresses = (addresses: GroupAddress[]) => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(GROUP_ADDRESSES_KEY, JSON.stringify(addresses));
};
