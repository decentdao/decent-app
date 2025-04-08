// eslint-disable-next-line import/no-extraneous-dependencies
import { fetchAndActivate, getValue, Value } from 'firebase/remote-config';
import { useState, useEffect } from 'react';
import { remoteConfig } from '../insights/firebase';
import { IFeatureFlags, FeatureFlagKeys, FeatureFlagKey, FeatureFlags } from './featureFlags';

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
    const envVar = this.getEnvVar(key);
    const urlParam = this.getUrlParam(key);

    if (urlParam === 'on') return true;
    if (envVar === 'on' && urlParam !== 'off') return true;
    return false;
  }
}

interface RemoteConfigData {
  [key: string]: Value | undefined;
}

const useFeatureFlag = (key: FeatureFlagKey) => {
  const [remoteConfigData, setRemoteConfigData] = useState<RemoteConfigData>({});

  useEffect(() => {
    const fetchConfig = async () => {
      if (remoteConfig) {
        try {
          // Firebase uses browser cache, and uses the remoteConfig settings to refresh
          await fetchAndActivate(remoteConfig);
          const value = getValue(remoteConfig, key);
          setRemoteConfigData(prev => ({ ...prev, [key]: value }));
        } catch (error) {
          console.error('Failed to fetch Remote Config', error);
        }
      }
    };

    fetchConfig();
  }, [key, remoteConfigData]);

  // Get from local first, either the URL params, or .env settings
  let value = FeatureFlags.instance?.isFeatureEnabled(key);
  if (value != true) {
    const remoteValue = remoteConfigData[key];
    value = remoteValue?.asString()?.toLowerCase() == 'on' || remoteValue?.asBoolean() == true;
  }

  return value;
};

export default useFeatureFlag;
