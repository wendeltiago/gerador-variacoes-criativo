# Gerador de Variações de Criativo

Aplicação independente para preparar variações de anúncios em vídeo. O projeto não compartilha código com Sabor Sem Culpa, Glicemia em Dia ou `your-little-helper`.

## Desenvolvimento

```bash
npm install
npm run dev
```

## Build de produção

```bash
npm run build
npm run preview
```

## Privacidade e limites

Os vídeos selecionados são processados no navegador e não são enviados a um servidor por esta aplicação. As preferências são salvas no armazenamento local do navegador. A exportação de vídeo usa MediaRecorder e depende dos formatos suportados pelo navegador; a saída poderá ser WebM em vez de MP4.