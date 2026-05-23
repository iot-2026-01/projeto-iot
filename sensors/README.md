# Sistema Inteligente de Balanceamento Dinâmico de Carga

Projeto IoT em **ESP32** que monitora a corrente em três circuitos elétricos e, ao detectar sobrecarga, desliga automaticamente a carga correspondente por meio de relés — redistribuindo a energia para proteger a instalação.

A telemetria é publicada via **MQTT** em JSON (ideal para dashboards em Grafana, Node-RED, ThingsBoard, etc.) e continua disponível na porta serial em CSV.

O firmware roda no simulador [Wokwi](https://wokwi.com) (`diagram.json`) ou em hardware real com sensores SCT-013. O sketch também compila no **Arduino Uno**, mas sem Wi-Fi/MQTT (apenas serial).

## O que o sistema faz

1. **Mede a corrente** (RMS) em três canais (A, B e C) a partir de sensores analógicos.
2. **Detecta sobrecarga** quando a corrente ultrapassa 15 A (com histerese de 1,5 A para evitar liga/desliga repetido).
3. **Aciona relés** para cortar a carga do canal em sobrecarga e religá-la quando a corrente normaliza.
4. **Sinaliza** o estado com LEDs vermelhos, buzzer intermitente e display LCD I2C.
5. **Registra dados** na porta serial (CSV) e publica telemetria MQTT (JSON) a cada 1 s.

## Funcionalidades

| Recurso | Descrição |
|--------|-----------|
| Medição RMS | 200 amostras por canal, com conversão para amperes |
| Proteção automática | Relés desligam a carga em sobrecarga (lógica ativa em LOW) |
| Display LCD | Três modos: correntes ao vivo, estado dos relés, estatísticas |
| Botões | Override manual, reset do sistema e troca de modo no LCD |
| Log serial | CSV a cada 1 s: canal, corrente, sobrecarga, estado do relé |
| MQTT | JSON no tópico `projeto-iot/<device>/telemetria` para dashboards |
| Estatísticas | Contagem de eventos de sobrecarga e de redistribuições |

## Hardware

### Simulação (Wokwi)

- ESP32 DevKit C
- Wi-Fi simulado (`Wokwi-GUEST`, sem senha)
- Três potenciômetros (simulam sensores SCT-013 nos GPIO 34, 35, 32)
- LCD 16×2 com módulo I2C (endereço `0x27`)
- Três módulos de relé
- Três LEDs de status (sobrecarga)
- Buzzer ativo
- Três botões: Override (verde), Reset (amarelo), Modo (azul)

### Montagem real (referência)

Substitua os potenciômetros por **transformadores de corrente SCT-013** com circuito de condicionamento (offset em 2,5 V no pino analógico). Os demais componentes seguem o mesmo mapa de pinos do sketch.

## Mapa de pinos (ESP32)

| Pino | Função |
|------|--------|
| GPIO 34, 35, 32 | Sensores de corrente (canais A, B, C) |
| GPIO 21 (SDA), 22 (SCL) | LCD I2C |
| GPIO 25, 26, 27 | Relés (LOW = relé ligado / carga cortada) |
| GPIO 18, 19, 23 | LEDs de sobrecarga (HIGH = alerta) |
| GPIO 5 | Buzzer |
| GPIO 12 | Botão Override |
| GPIO 13 | Botão Reset |
| GPIO 14 | Botão Modo (LCD) |

> No Arduino Uno, o sketch usa os pinos originais (A0–A2, D2–D12), sem MQTT.

## Como funciona

```
Sensores → Medição RMS → Detecção de sobrecarga → Relés + LEDs + Buzzer
                              ↓
                    LCD + Serial + MQTT
```

- **Limiar de sobrecarga:** 15 A; o canal só deixa o estado de sobrecarga abaixo de 13,5 A (histerese).
- **Redistribuição:** com override desligado, o firmware liga o relé do canal sobrecarregado (corta a carga) e restaura quando a corrente cai.
- **Override manual:** o botão em D10 desativa o controle automático e mantém os três relés acionados (útil para testes).
- **Reset:** limpa estados de sobrecarga, relés, LEDs e buzzer; desliga o override.
- **Modo LCD:** alterna entre correntes (`A:12.3A B:8.1A`), relés (`Relays: X O O`) e contadores (`Eventos` / `Redistrib`).

## MQTT e dashboard

### Configuração

1. Copie `secrets.h.example` para `secrets.h`:
   ```bash
   cp secrets.h.example secrets.h
   ```
2. Edite `secrets.h` com seu Wi-Fi, broker MQTT e ID do dispositivo.
3. No Wokwi, os padrões já funcionam (`Wokwi-GUEST` + `broker.hivemq.com`).

### Tópico e payload

| Item | Valor |
|------|--------|
| Tópico | `projeto-iot/balancer-01/telemetria` (ajuste `DEVICE_ID` em `secrets.h`) |
| Formato | JSON |
| Intervalo | 1 s (mesmo do log serial) |

Exemplo de mensagem:

```json
{
  "device": "balancer-01",
  "uptime_ms": 45230,
  "override": false,
  "any_overload": true,
  "events": 3,
  "redistributions": 2,
  "channels": [
    { "id": 1, "current_a": 12.45, "overload": false, "relay": false },
    { "id": 2, "current_a": 16.20, "overload": true, "relay": true },
    { "id": 3, "current_a": 8.30, "overload": false, "relay": false }
  ]
}
```

### Testar a publicação

1. Inicie a simulação no Wokwi ou grave o firmware no ESP32.
2. Assine o tópico com [MQTT Explorer](https://mqtt-explorer.com), o cliente web da [HiveMQ](https://www.hivemq.com/demos/websocket-client/) ou:
   ```bash
   mosquitto_sub -h broker.hivemq.com -t "projeto-iot/balancer-01/telemetria" -v
   ```

### Conectar a um dashboard

| Ferramenta | Como usar |
|------------|-----------|
| **Node-RED** | Nó `mqtt in` no tópico acima → `json` → nós `gauge` / `chart` em `channels[0].current_a`, etc. |
| **Grafana** | Plugin MQTT ou Telegraf + InfluxDB; mapeie campos JSON das correntes e flags de sobrecarga. |
| **ThingsBoard** | Cadastre o ESP32 como device MQTT; use telemetria `current_a`, `overload`, `relay` por canal. |

Use um broker próprio (Mosquitto, HiveMQ Cloud, EMQX) em produção — o broker público da HiveMQ é apenas para testes.

## Como executar

### No Wokwi

1. Abra [wokwi.com](https://wokwi.com) e importe este repositório ou copie `sketch.ino`, `diagram.json` e `libraries.txt`.
2. Placa: **ESP32** (já configurada no `diagram.json`).
3. Inicie a simulação — o firmware conecta ao Wi-Fi `Wokwi-GUEST` e publica no MQTT.
4. Gire os potenciômetros para simular corrente; acima do limiar, LEDs, buzzer e relés respondem.
5. Serial Monitor (9600 baud) mostra CSV; assine o tópico MQTT para ver o JSON.

### No Arduino IDE (ESP32)

1. Placa: **ESP32 Dev Module**.
2. Bibliotecas: **LiquidCrystal I2C**, **PubSubClient**.
3. `cp secrets.h.example secrets.h` e configure Wi-Fi + broker.
4. Conecte o hardware conforme o mapa de pinos ESP32.
5. Compile e envie.

### Arduino Uno (sem MQTT)

Compile selecionando Arduino Uno — apenas log serial; para dashboard use ESP32 ou um módulo Wi-Fi externo.

## Saída serial (exemplo)

```
Ch,Current_A,Overload,Relay
1,12.45,0,0
2,16.20,1,1
3,8.30,0,0
```

- **Overload:** `1` = canal em sobrecarga  
- **Relay:** `1` = relé acionado (carga cortada)

## Estrutura do repositório

| Arquivo | Descrição |
|---------|-----------|
| `sketch.ino` | Firmware principal (ESP32 + MQTT, Uno serial) |
| `diagram.json` | Esquema Wokwi (ESP32) |
| `libraries.txt` | LiquidCrystal I2C, PubSubClient |
| `secrets.h.example` | Modelo de credenciais Wi-Fi/MQTT |
| `secrets.h` | Suas credenciais (não commitar) |

## Parâmetros ajustáveis

No início de `sketch.ino` é possível alterar:

- `OVERLOAD_THRESHOLD` — limiar de sobrecarga (padrão: 10 A)
- `HYSTERESIS` — margem para sair da sobrecarga (padrão: 1,5 A)
- `AMPS_PER_COUNT` — fator de conversão ADC → amperes
- `SAMPLES` / `SAMPLE_INTERVAL_US` — precisão e tempo da medição RMS

## Licença

Consulte o repositório ou o autor para termos de uso. Este projeto foi desenvolvido para fins educacionais e de prototipagem em IoT e gestão de energia.
