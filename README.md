# 🛡️ Agendador de Envio de Tropas – Tribal Wars

Um painel flutuante que permite **agendar automaticamente o envio de tropas** com precisão de milissegundos, usando o horário do servidor do Tribal Wars. Ideal para ataques cronometrados, defesas coordenadas e movimentações estratégicas.

---

## ⚙️ Funcionalidades

- 📅 **Agendamento por Data e Hora**
  - Define a hora exata do envio ou chegada.

- 🎯 **Modo de Agendamento**
  - `🚀 Saída`: envia no horário exato configurado.
  - `🎯 Chegada`: calcula o envio com base no tempo de viagem.

- ⏱️ **Contador regressivo dinâmico**
  - Exibe em tempo real o tempo restante até o envio (`⏳ Enviando em 1m 32s`).

- 🛑 **Botão de Cancelamento**
  - Permite cancelar o envio agendado antes da execução.

- 💾 **Salvamento e Histórico**
  - Armazena múltiplos agendamentos com ajustes personalizados.
  - Edição, exclusão e execução rápida.

- 🔒 **Antilogoff integrado**
  - Simula atividade no navegador para manter a sessão ativa.

- 🧠 **Interface estilo Tribal Wars**
  - Painel flutuante com visual integrado ao jogo.
  - Tipografia, cores e botões no padrão do game.

---

## 🧭 Como Usar

1. Vá para a tela de **confirmação de envio de tropas** (`troop_confirm.php`).
2. Execute o script via console ou marcador (bookmarklet).
3. O painel será exibido no canto superior direito.
4. Preencha:
   - Data e hora alvo *(preenchido automaticamente com o horário atual do servidor)*.
   - Ajuste fino, se necessário.
   - Escolha o modo: `Saída` ou `Chegada`.
5. Clique em **💾 Salvar** e depois em **▶️ Agendar**.
6. O script fará o envio exatamente no momento configurado.
7. ✅ Após o envio, o botão será clicado automaticamente e o painel se reativará para novos agendamentos.

---

## 🔐 Segurança

Este script **não automatiza login**, **não envia múltiplas tropas por vez** e **não infringe as regras básicas do Tribal Wars**, desde que usado com bom senso. Ele apenas automatiza um clique em um botão com base em tempo definido por você.

---

## 📝 Requisitos

- Rodar diretamente no navegador com o jogo aberto.
- O horário do servidor deve estar visível no DOM nos elementos:
  - `#serverDate`
  - `#serverTime`

---

## 🧪 Exemplos de uso

- Coordenar ataques de fakes e ofensivas em segundos diferentes.
- Programar uma defesa para coincidir com o retorno das tropas.
- Executar combos de múltiplas abas sem depender de cronômetro manual.

---

## 📦 Instalação rápida (Bookmarklet)

Crie um favorito no navegador com o seguinte conteúdo:

```js
javascript:$.getScript('https://tribalwarstools.github.io/agendamento-de-tropas/agendadorEnvio.js');
