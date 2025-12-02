// src/hoc/withTranslations.js
import React from 'react';
import { useTranslations } from '../hooks/useTranslations';

/**
 * Higher-Order Component that wraps any component with translation capabilities
 * @param {React.ComponentType} Component - The component to wrap
 * @returns {React.ComponentType} - The wrapped component with translation props
 */
export const withTranslations = (Component) => {
  return (props) => {
    const translationUtils = useTranslations();
    
    return <Component {...props} {...translationUtils} />;
  };
};

export default withTranslations;