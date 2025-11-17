# Hardhat Setup Complete!

Tu proyecto Next.js ahora está integrado con Hardhat para desarrollo Web3.

## ¿Qué se instaló?

### Dependencias
- **hardhat**: Framework de desarrollo para Ethereum
- **@nomicfoundation/hardhat-toolbox**: Conjunto completo de plugins de Hardhat
- **@nomicfoundation/hardhat-ethers**: Plugin para integrar ethers.js
- **ethers**: Librería para interactuar con Ethereum
- **ts-node**: Soporte para TypeScript en Node.js

### Estructura de Archivos

```
pulpa/
├── contracts/             # Contratos inteligentes en Solidity
│   └── Lock.sol          # Contrato de ejemplo (bloqueador de fondos)
├── scripts/              # Scripts de deployment
│   └── deploy.ts         # Script para desplegar contratos
├── test/                 # Tests de contratos
│   └── Lock.test.ts      # Tests del contrato Lock
├── hardhat.config.cjs    # Configuración de Hardhat
├── .env.example          # Ejemplo de variables de entorno
└── HARDHAT_README.md     # Documentación completa
```

## Comandos Disponibles

### Compilar Contratos
```bash
npm run hardhat:compile
```
**Estado**: ✅ Funcionando - 1 archivo Solidity compilado exitosamente

### Ejecutar Tests
```bash
npm run hardhat:test
```
**Nota**: Los tests están configurados pero pueden requerir ajustes adicionales para TypeScript + CommonJS.

### Iniciar Nodo Local
```bash
npm run hardhat:node
```
Esto iniciará una blockchain local de Hardhat en http://127.0.0.1:8545

### Deploy de Contratos
```bash
# Deploy en red local de Hardhat
npm run hardhat:deploy

# Deploy en localhost (requiere nodo corriendo)
npm run hardhat:deploy:local
```

## Próximos Pasos

### 1. Configurar Variables de Entorno

Copia `.env.example` a `.env` y configura:
```bash
cp .env.example .env
```

Edita `.env` con tus valores:
- `SEPOLIA_RPC_URL`: URL RPC de Infura o Alchemy
- `PRIVATE_KEY`: Tu clave privada (usa una wallet de prueba)
- `ETHERSCAN_API_KEY`: Para verificación de contratos

### 2. Usar Contratos en Next.js

Ejemplo de integración en tu aplicación Next.js:

```typescript
// app/components/Web3Example.tsx
'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import LockArtifact from '../artifacts/contracts/Lock.sol/Lock.json';

export default function Web3Example() {
  const [contractAddress, setContractAddress] = useState('');
  const [unlockTime, setUnlockTime] = useState('');

  async function connectAndRead() {
    if (typeof window.ethereum !== 'undefined') {
      // Conectar con MetaMask
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();

      // Conectar con el contrato
      const lock = new ethers.Contract(
        contractAddress,
        LockArtifact.abi,
        signer
      );

      // Leer datos del contrato
      const time = await lock.unlockTime();
      setUnlockTime(time.toString());
    }
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Contract Address"
        value={contractAddress}
        onChange={(e) => setContractAddress(e.target.value)}
      />
      <button onClick={connectAndRead}>
        Read Unlock Time
      </button>
      {unlockTime && <p>Unlock Time: {unlockTime}</p>}
    </div>
  );
}
```

### 3. Desplegar tu Primer Contrato

```bash
# 1. Inicia el nodo local
npm run hardhat:node

# 2. En otra terminal, despliega
npm run hardhat:deploy:local

# 3. Copia la dirección del contrato deployado
# 4. Úsala en tu aplicación Next.js
```

### 4. Crear Tus Propios Contratos

Crea un nuevo archivo en `contracts/`, por ejemplo `MyContract.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MyContract {
    string public message;

    constructor(string memory _message) {
        message = _message;
    }

    function updateMessage(string memory _newMessage) public {
        message = _newMessage;
    }
}
```

Luego compila:
```bash
npm run hardhat:compile
```

## Recursos

- [Hardhat Docs](https://hardhat.org/docs)
- [Ethers.js v6 Docs](https://docs.ethers.org/v6/)
- [Solidity Docs](https://docs.soliditylang.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Next.js Web3 Integration](https://nextjs.org/docs)

## Troubleshooting

### TypeScript + ES Modules
Si encuentras errores con imports/exports:
- Hardhat usa CommonJS (hardhat.config.cjs)
- Next.js usa ES modules
- Los archivos .ts en test/ y scripts/ usan ES imports

Para tests, considera convertir los archivos a `.js` si encuentras problemas.

### MetaMask Connection
Asegúrate de:
- Tener MetaMask instalado
- Conectar a la red correcta (localhost, Sepolia, etc.)
- Tener fondos de prueba en tu wallet

## Seguridad

⚠️ **IMPORTANTE**:
- **NUNCA** commits tu `.env` al repositorio
- **NUNCA** uses tu clave privada real en desarrollo
- Usa wallets de prueba separadas
- Verifica tus contratos antes de deployar a mainnet

## ¿Todo Listo?

✅ Hardhat instalado y configurado
✅ Contrato de ejemplo compilado
✅ Scripts de deployment listos
✅ Configuración de redes preparada
✅ Integración con Next.js documentada

**¡Estás listo para desarrollar dApps con Next.js + Hardhat!**
