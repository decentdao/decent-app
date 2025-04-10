// eslint-disable-next-line import/no-extraneous-dependencies
import { fetchAndActivate, getValue, Value } from 'firebase/remote-config';
import { useState } from 'react';
import { useBetween } from 'use-between';
import { remoteConfig } from '../insights/firebase';
import {
  IFeatureFlags,
  FeatureFlagKeys,
  FeatureFlagKey,
  FeatureFlags,
  FEATURE_FLAGS,
} from './featureFlags';

export class EnvironmentFeatureFlags implements IFeatureFlags {
  urlParams: { [key: string]: string | null } = {};
  envVars: { [key: string]: any } = {};

  private keyToEnvVar = (key: FeatureFlagKey): string => {
    return `VITE_APP_${key.toUpperCase()}`;
  };

  private keyToQueryParam = (key: FeatureFlagKey): string => {
    return key.toLowerCase();
  };

  constructor(featureFlags: FeatureFlagKeys) {
    const urlParams = new URLSearchParams(window.location.search);
    const envVars = import.meta.env;

    // Check all feature flags
    featureFlags.forEach(featureFlag => {
      const envValue = envVars[this.keyToEnvVar(featureFlag)];
      this.setEnvVar(featureFlag, envValue);

      const queryParam = urlParams.get(this.keyToQueryParam(featureFlag));
      this.setUrlParam(featureFlag, queryParam);
    });
  }

  setEnvVar(key: FeatureFlagKey, value: any): void {
    this.envVars[key] = value?.toLowerCase();
  }

  getEnvVar(key: FeatureFlagKey) {
    return this.envVars[key];
  }

  setUrlParam(key: FeatureFlagKey, value: string | null): void {
    if (value === null) {
      this.urlParams[key] = null;
    } else {
      this.urlParams[key] = value.toLowerCase();
    }
  }

  getUrlParam(key: FeatureFlagKey) {
    return this.urlParams[key];
  }

  isFeatureEnabled(key: FeatureFlagKey) {
    const urlParam = this.getUrlParam(key);
    if (urlParam === 'on') return true;
    if (urlParam === 'off') return false;

    const envVar = this.getEnvVar(key);
    if (envVar === 'on') return true;
    if (envVar === 'off') return false;
    return undefined;
  }
}

interface RemoteConfigData {
  [key: string]: Value | undefined;
}

const useRemoteFeatureFlags = () => {
  const [remoteConfigData, setRemoteConfigData] = useState<RemoteConfigData>({});

  const fetchConfig = async () => {
    if (remoteConfig) {
      try {
        // Firebase uses browser cache, and uses the remoteConfig settings to refresh
        await fetchAndActivate(remoteConfig);
        let newData = {} as RemoteConfigData;
        for (const flag of FEATURE_FLAGS) {
          const value = getValue(remoteConfig, flag);
          newData[flag] = value;
        }
        setRemoteConfigData(prevData => {
          if (JSON.stringify(newData) !== JSON.stringify(prevData)) {
            return newData;
          } else {
            return prevData;
          }
        });
      } catch (error) {
        console.error('Failed to fetch Remote Config', error);
      }
    }
  };

  return { remoteConfigData, fetchConfig };
};

const useFeatureFlag = (key: FeatureFlagKey) => {
  const { remoteConfigData, fetchConfig } = useBetween(useRemoteFeatureFlags);

  fetchConfig();

  // Get from local first, either the URL params, or .env settings
  let value = FeatureFlags.instance?.isFeatureEnabled(key);
  if (value === undefined) {
    // If not found in local, use remote config
    const remoteValue = remoteConfigData[key];
    value = remoteValue?.asString()?.toLowerCase() == 'on' || remoteValue?.asBoolean() == true;
  }

  return value;
};

export default useFeatureFlag;
