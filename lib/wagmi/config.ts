import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { optimism, mainnet } from 'wagmi/chains';

export const wagmiConfig = getDefaultConfig({
  appName: '$PULPA NFC Distribution',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [optimism, mainnet],
  ssr: true,
});
