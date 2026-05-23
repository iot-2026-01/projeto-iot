# Como Usar o Sistema de Balanceamento de Carga Inteligente

## O que você vai precisar

- Um computador com acesso à internet
- O programa **Node.js** (versão 24 ou superior) instalado
- O programa **npm** (já vem junto com o Node.js)

---

## Passo a passo para rodar o projeto

### 1. Baixe o projeto

Se você recebeu o projeto como uma pasta compactada, descompacte em qualquer lugar do seu computador.

Se estiver usando Git, abra o terminal e digite:

```
git clone <endereço-do-repositório>
```

### 2. Inicie o servidor (backend)

Abra o terminal na pasta do projeto e siga estes passos:

```
cd api
npm install
npm run dev
```

Aguarde aparecer uma mensagem indicando que o servidor está rodando. Pronto, o backend está funcionando!

### 3. Inicie o painel de controle (frontend)

Abra **outro terminal** (mantenha o anterior aberto) na pasta do projeto e siga estes passos:

```
cd frontend
npm install
npm run dev
```

Aguarde aparecer um endereço no terminal (algo como `http://localhost:5173`). Abra esse endereço no seu navegador.

### 4. Pronto!

O painel de controle vai aparecer no navegador. Você já pode monitorar e controlar o sistema.

---

## Configurando a simulação Wokwi (opcional)

Se você não tem o hardware físico (ESP32, sensores, relés), pode usar o simulador Wokwi para testar o sistema completo no navegador.

### 1. Acesse o Wokwi

Abra o site https://wokwi.com e crie uma conta gratuita (ou faça login).

### 2. Abra o projeto de simulação

Importe o arquivo `diagram.json` do projeto ou crie um novo projeto ESP32 com os componentes:
- 3 potenciômetros (simulam os sensores de corrente)
- 1 display LCD
- 3 relés
- 3 LEDs
- 1 buzzer
- 3 botões

### 3. Configure o Wi-Fi

A simulação do Wokwi já vem com Wi-Fi embutido. As credenciais usadas são:
- Rede: `Wokwi-GUEST`
- Senha: (vazia)

Não é necessário alterar nada — a conexão é automática dentro do simulador.

### 4. Conecte ao servidor

Com o backend rodando (passo 2 da seção anterior), a simulação vai se conectar automaticamente ao broker MQTT público (`broker.hivemq.com`) e começar a enviar dados de telemetria.

### 5. Teste o sistema

- Gire os potenciômetros para simular variações de corrente
- Quando o valor ultrapassar 15A, o sistema vai detectar sobrecarga
- O relé correspondente será desligado automaticamente
- O painel web vai refletir as mudanças em tempo real

---

## Como parar o sistema

Para encerrar, vá em cada terminal aberto e pressione `Ctrl + C`.

---

## Problemas comuns

| Problema | Solução |
|----------|---------|
| "command not found: npm" | Instale o Node.js pelo site oficial: https://nodejs.org |
| O painel não carrega no navegador | Verifique se o servidor (passo 2) está rodando |
| Erro de conexão no painel | Verifique se o backend está ativo no outro terminal |

---

## Dica

Mantenha sempre os dois terminais abertos (backend e frontend) enquanto estiver usando o sistema.
