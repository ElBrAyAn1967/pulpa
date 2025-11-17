# Hardhat Configuration for Next.js + Web3

Este proyecto Next.js está configurado con Hardhat para desarrollo de contratos inteligentes.

## Estructura del Proyecto

```
pulpa/
├── contracts/          # Contratos inteligentes en Solidity
│   └── Lock.sol       # Contrato de ejemplo
├── scripts/           # Scripts de deployment
│   └── deploy.ts      # Script de deployment
├── test/              # Tests de contratos
│   └── Lock.test.ts   # Tests del contrato Lock
├── hardhat.config.ts  # Configuración de Hardhat
└── .env.example       # Variables de entorno de ejemplo
```

## Comandos Disponibles

### Compilar Contratos
```bash
npm run hardhat:compile
```

### Ejecutar Tests
```bash
npm run hardhat:test
```

### Iniciar Nodo Local
```bash
npm run hardhat:node
```

### Deploy
```bash
# Deploy en red de prueba local de Hardhat
npm run hardhat:deploy

# Deploy en localhost (requiere nodo corriendo)
npm run hardhat:deploy:local
```

## Configuración

1. Copia `.env.example` a `.env`:
```bash
cp .env.example .env
```

2. Configura tus variables de entorno en `.env`:
   - `SEPOLIA_RPC_URL`: URL de RPC para Sepolia testnet
   - `PRIVATE_KEY`: Tu clave privada (¡NUNCA la compartas!)
   - `ETHERSCAN_API_KEY`: Tu API key de Etherscan

## Integración con Next.js

Para usar los contratos en tu aplicación Next.js:

```typescript
import { ethers } from 'ethers';

// Conectar con MetaMask
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// Importar ABI del contrato compilado
import LockArtifact from '../artifacts/contracts/Lock.sol/Lock.json';

// Crear instancia del contrato
const contractAddress = 'YOUR_DEPLOYED_CONTRACT_ADDRESS';
const lock = new ethers.Contract(contractAddress, LockArtifact.abi, signer);

// Llamar funciones del contrato
const unlockTime = await lock.unlockTime();
```

## Redes Configuradas

- **hardhat**: Red de prueba local (chainId: 1337)
- **localhost**: Red local (http://127.0.0.1:8545)
- **sepolia**: Sepolia testnet (descomentar en hardhat.config.ts)

## Recursos

- [Documentación de Hardhat](https://hardhat.org/docs)
- [Documentación de Ethers.js](https://docs.ethers.org/v6/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

## Notas de Seguridad

- ⚠️ **NUNCA** commits tu archivo `.env` al repositorio
- ⚠️ **NUNCA** compartas tu clave privada
- ⚠️ Usa una wallet de prueba para desarrollo
- ⚠️ Revisa tus contratos antes de deployar a mainnet
