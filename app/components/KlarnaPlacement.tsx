import React from 'react';

interface KlarnaPlacementProps {
  'data-key'?: string;
  'data-locale'?: string;
  'data-purchase-amount'?: string;
  'data-theme'?: string;
  'data-environment'?: string;
  'data-client-id'?: string;
  id?: string;
  className?: string;
}

const KlarnaPlacement: React.FC<KlarnaPlacementProps> = (props) => {
  return React.createElement('klarna-placement', props);
};

export default KlarnaPlacement;
