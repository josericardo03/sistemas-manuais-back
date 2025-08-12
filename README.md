# Sistema de Manuais - TypeScript

Este projeto foi convertido para TypeScript para melhor tipagem e desenvolvimento.

## Instalação

```bash
npm install
```

## Scripts Disponíveis

- **`npm run build`** - Compila o TypeScript para JavaScript
- **`npm start`** - Executa o servidor compilado
- **`npm run dev`** - Executa o servidor em modo desenvolvimento com ts-node
- **`npm run watch`** - Compila automaticamente quando há mudanças

## Desenvolvimento

Para desenvolvimento, use:

```bash
npm run dev
```

Para produção, compile primeiro:

```bash
npm run build
npm start
```

## Estrutura do Projeto

- `server.ts` - Servidor principal em TypeScript
- `tsconfig.json` - Configuração do TypeScript
- `types/` - Definições de tipos personalizados
- `dist/` - Código compilado (gerado automaticamente)

## Benefícios da Conversão para TypeScript

1. **Tipagem estática** - Detecta erros em tempo de compilação
2. **IntelliSense melhorado** - Autocompletar mais preciso
3. **Refatoração segura** - Mudanças de código mais confiáveis
4. **Documentação inline** - Tipos servem como documentação
5. **Manutenibilidade** - Código mais fácil de manter e expandir
