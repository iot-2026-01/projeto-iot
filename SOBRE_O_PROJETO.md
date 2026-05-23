# Sobre o Projeto — Sistema de Balanceamento de Carga Inteligente

## O que é este projeto?

Este é um sistema inteligente que monitora a corrente elétrica em três circuitos diferentes e age automaticamente para evitar sobrecargas. Pense nele como um "guardião" da sua instalação elétrica: ele fica de olho no consumo e, se algo passar do limite seguro, desliga o circuito automaticamente para proteger os equipamentos e a fiação.

O sistema funciona com um microcontrolador ESP32 conectado a sensores de corrente, relés e um painel de controle acessível pelo navegador.

---

## Para que serve?

Imagine que você tem três circuitos elétricos em casa ou em um ambiente comercial — por exemplo, iluminação, ar-condicionado e tomadas gerais. Se um desses circuitos consumir mais do que o limite seguro (por padrão, 15 ampères), o sistema:

1. Detecta a sobrecarga
2. Aciona um alerta visual (LED) e sonoro (buzzer)
3. Desliga automaticamente o circuito sobrecarregado via relé
4. Mostra tudo em tempo real no painel de controle

Quando o consumo volta ao normal, o sistema religa o circuito automaticamente.

---

## Funcionalidades

### Monitoramento em tempo real
- Acompanhe a corrente elétrica de cada um dos três canais (A, B e C) em tempo real
- Veja o tempo de funcionamento do sistema (uptime)
- Visualize o número de eventos de sobrecarga que já ocorreram

### Detecção automática de sobrecarga
- O sistema identifica quando um canal ultrapassa o limite de segurança
- Usa um mecanismo de histerese para evitar liga-desliga repetitivo (o canal só volta ao normal quando a corrente cai significativamente abaixo do limite)

### Controle de relés
- Cada canal possui um relé que pode ser desligado automaticamente em caso de sobrecarga
- Você também pode controlar os relés manualmente pelo painel de controle

### Modo de override (manual)
- Permite desativar o controle automático dos relés
- Útil para manutenção ou situações em que você quer manter um circuito ligado mesmo com alerta

### Botão de reset
- Limpa todos os alertas de sobrecarga
- Restaura o sistema ao estado normal de operação

### Painel de controle web
- Interface visual acessível pelo navegador
- Mostra o status de cada canal com indicadores coloridos (verde = normal, vermelho = sobrecarga)
- Permite controlar relés e resetar o sistema com um clique
- Disponível em múltiplos idiomas (português e inglês)

### Telemetria via MQTT
- O sistema envia dados em tempo real para um broker MQTT
- Compatível com plataformas de monitoramento como Grafana, Node-RED e ThingsBoard
- Permite criar dashboards personalizados e históricos de consumo

### Simulação com Wokwi
- O projeto pode ser testado sem hardware real usando o simulador Wokwi
- Potenciômetros simulam os sensores de corrente
- Ideal para aprendizado e demonstrações

---

## Resumo dos componentes

| Componente | Função |
|-----------|--------|
| ESP32 | Cérebro do sistema — processa dados e controla tudo |
| Sensores SCT-013 | Medem a corrente elétrica em cada circuito |
| Relés | Ligam e desligam os circuitos automaticamente |
| LEDs | Indicam visualmente qual canal está em sobrecarga |
| Buzzer | Alerta sonoro quando há sobrecarga |
| Display LCD | Mostra informações no próprio dispositivo |
| Painel Web | Interface no navegador para monitorar e controlar remotamente |
| API Backend | Servidor que conecta o hardware ao painel web |

---

## Para quem é este projeto?

- Estudantes de engenharia elétrica e eletrônica
- Entusiastas de IoT (Internet das Coisas)
- Profissionais que querem proteger instalações elétricas de forma inteligente
- Qualquer pessoa interessada em automação residencial ou comercial
