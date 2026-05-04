# ValeRepor

Sistema PWA/offline para controle de validade e reposição de produtos em supermercados.

## Como rodar

```bash
npm install
npm run dev
```

## Como gerar build

```bash
npm run build
```

Build validado nesta edição com sucesso.

## Principais ajustes desta versão

- Nome comercial ajustado para **ValeRepor**.
- Alerta padrão alterado para **30 dias** antes do vencimento.
- Cadastro e edição de produtos.
- Cadastro e edição de setores/prateleiras.
- Cadastro de reposição com campo de **lote**.
- Edição de reposições pela tela de Alertas.
- Validações de quantidade, datas obrigatórias e validade anterior à reposição.
- Bloqueio de exclusão de produtos/locais com reposições vinculadas.
- Histórico de ações quando o status muda.
- Relatório com lote, histórico de ações, totais por status e setor.
- Backup JSON, importação de backup, limpeza de dados locais e carregamento manual de dados de exemplo.
- Ícones PWA criados: `icon-192.png` e `icon-512.png`.
- Service worker melhorado com cache básico para funcionamento offline após o primeiro carregamento.
- Dependências reduzidas para facilitar instalação e evitar conflitos de pacotes.

## Observação importante

Os dados continuam salvos no dispositivo via `localStorage`. Para uso comercial real, recomendo reforçar com backup frequente ou evoluir para backend/banco de dados com login e sincronização.
