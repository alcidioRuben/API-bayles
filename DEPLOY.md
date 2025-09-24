# 🚀 Baileys WhatsApp API - Deploy na Railway

## 📋 Pré-requisitos

1. **Conta no Railway** - [railway.app](https://railway.app)
2. **Conta no GitHub** - [github.com](https://github.com)
3. **PostgreSQL no Railway** (já configurado)

## 🚀 Deploy Rápido

### PASSO 1: Fork do Repositório
1. Faça fork deste repositório no GitHub
2. Clone seu fork localmente

### PASSO 2: Deploy na Railway
1. Acesse [railway.app](https://railway.app)
2. Clique em "New Project"
3. Selecione "Deploy from GitHub repo"
4. Escolha seu repositório forkado
5. Railway detectará automaticamente que é um projeto Node.js

### PASSO 3: Configurar Variáveis de Ambiente
No Railway Dashboard, vá em "Variables" e adicione:

```env
NODE_ENV=production
JWT_SECRET=sua-chave-jwt-super-secreta-aqui
API_KEY_SECRET=sua-chave-api-super-secreta-aqui
WEBHOOK_SECRET=sua-chave-webhook-secreta-aqui
```

**IMPORTANTE:** A `DATABASE_URL` é fornecida automaticamente pelo Railway!

### PASSO 4: Deploy
1. Railway fará o deploy automaticamente
2. Aguarde alguns minutos
3. Sua API estará disponível em: `https://seu-app.railway.app`

## 🔧 Configuração Pós-Deploy

### 1. Executar Migrações do Banco
No Railway Dashboard, vá em "Deployments" > "View Logs" e execute:

```bash
npx prisma migrate deploy
```

### 2. Testar a API
```bash
curl https://seu-app.railway.app/health
```

### 3. Criar Primeiro Usuário
```bash
curl -X POST https://seu-app.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu@email.com",
    "name": "Seu Nome",
    "password": "suasenha123"
  }'
```

## 📱 URLs Disponíveis

- **API:** `https://seu-app.railway.app`
- **Dashboard:** `https://seu-app.railway.app/dashboard`
- **Documentação:** `https://seu-app.railway.app/api-docs`
- **Health Check:** `https://seu-app.railway.app/health`

## 🔑 Como Obter API Key

1. **Registre-se** via API ou Dashboard
2. **Faça login** para obter sua API Key
3. **Use a API Key** nos headers: `X-API-Key: sua-api-key-aqui`

## 🆘 Suporte

Se tiver problemas:
1. Verifique os logs no Railway Dashboard
2. Confirme se as variáveis de ambiente estão corretas
3. Teste o health check primeiro

## 🎯 Próximos Passos

1. ✅ Deploy na Railway
2. ✅ Configurar variáveis de ambiente
3. ✅ Executar migrações do banco
4. ✅ Criar primeiro usuário
5. ✅ Obter API Key
6. ✅ Começar a usar a API!

---

**Feito com ❤️ para facilitar o deploy do Baileys WhatsApp API**
