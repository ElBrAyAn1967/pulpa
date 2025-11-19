# Envio Indexer Setup Instructions

## ⚠️ Important: Windows Installation

Envio actualmente tiene problemas con el binario para Windows. Hay dos opciones para ejecutar el indexer:

### Opción 1: WSL2 (Recomendado)

1. Instala WSL2 si no lo tienes:
```powershell
wsl --install
```

2. Dentro de WSL2, navega al proyecto:
```bash
cd /mnt/c/Users/Datos/pulpa/envio
```

3. Instala Node.js en WSL2 (si no está instalado):
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

4. Instala Envio CLI:
```bash
npm install -g envio
```

5. Instala dependencias:
```bash
npm install
```

6. Genera tipos:
```bash
npm run codegen
```

7. Ejecuta el indexer:
```bash
npm run dev
```

### Opción 2: Docker (Alternativa)

1. Crea un Dockerfile en el directorio `envio/`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install Envio CLI
RUN npm install -g envio

# Copy project files
COPY package*.json ./
RUN npm install

COPY . .

# Generate types
RUN npm run codegen

# Expose GraphQL port
EXPOSE 8080

CMD ["npm", "run", "dev"]
```

2. Construye la imagen:
```bash
docker build -t pulpa-indexer .
```

3. Ejecuta el contenedor:
```bash
docker run -p 8080:8080 pulpa-indexer
```

### Opción 3: Cloud Deployment

Envio también ofrece cloud hosting gratuito:

1. Crea una cuenta en [Envio Cloud](https://envio.dev)

2. Sube tu configuración:
```bash
envio deploy
```

3. El indexer se ejecutará en la nube y estará accesible vía GraphQL endpoint

## Verificación de la Instalación

Una vez que el indexer esté corriendo, verifica que funciona:

1. El indexer debe mostrar:
```
✓ Indexer started successfully
✓ GraphQL endpoint: http://localhost:8080/graphql
✓ Syncing from block...
```

2. Prueba una query GraphQL en `http://localhost:8080/graphql`:
```graphql
query {
  globalStats(id: "global") {
    totalDistributions
    totalAmbassadors
  }
}
```

## Archivos de Configuración Creados

✅ **config.yaml** - Configuración principal del indexer
- Red: Optimism Mainnet (ID: 10)
- Contrato: 0x029263aA1BE88127f1794780D9eEF453221C2f30
- Eventos: Transfer, RoleGranted, RoleRevoked

✅ **schema.graphql** - Schema de datos indexados
- Distribution: Eventos de minteo de tokens
- Ambassador: Estadísticas de embajadores
- Recipient: Estadísticas de receptores
- RoleEvent: Cambios de roles MINTER
- GlobalStats: Estadísticas agregadas

✅ **src/EventHandlers.ts** - Handlers de eventos
- Transfer handler: Detecta minteo (from == 0x0)
- RoleGranted handler: Rastrea asignación de MINTER_ROLE
- RoleRevoked handler: Rastrea revocación de MINTER_ROLE
- updateGlobalStats: Actualiza estadísticas globales

✅ **README.md** - Documentación completa con queries GraphQL de ejemplo

## Próximos Pasos

1. **Ejecutar el indexer** usando una de las opciones de arriba
2. **Verificar sincronización** - El indexer debe empezar a indexar eventos históricos
3. **Probar queries** - Usar GraphQL playground para consultar datos
4. **Integrar con Next.js** - Crear API routes que consulten el endpoint de Envio

## Ejemplo de Integración con Next.js

Crea `app/api/stats/route.ts`:

```typescript
import { gql, request } from 'graphql-request';

const ENVIO_ENDPOINT = process.env.ENVIO_GRAPHQL_ENDPOINT || 'http://localhost:8080/graphql';

const GET_GLOBAL_STATS = gql`
  query GetGlobalStats {
    globalStats(id: "global") {
      totalDistributions
      totalPulpaMinted
      totalAmbassadors
      totalRecipients
      lastUpdatedTimestamp
    }
  }
`;

export async function GET() {
  try {
    const data = await request(ENVIO_ENDPOINT, GET_GLOBAL_STATS);
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return Response.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
```

Luego usa en tu componente:

```typescript
'use client';

import { useEffect, useState } from 'react';

export function GlobalStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data.globalStats));
  }, []);

  if (!stats) return <div>Loading...</div>;

  return (
    <div>
      <h2>Global Distribution Stats</h2>
      <p>Total Distributions: {stats.totalDistributions}</p>
      <p>Total PULPA Minted: {stats.totalPulpaMinted}</p>
      <p>Active Ambassadors: {stats.totalAmbassadors}</p>
      <p>Unique Recipients: {stats.totalRecipients}</p>
    </div>
  );
}
```

## Soporte

Si tienes problemas:
1. Revisa logs del indexer
2. Verifica que la dirección del contrato es correcta
3. Asegúrate que el network ID es 10 (Optimism)
4. Consulta [Envio Docs](https://docs.envio.dev)
