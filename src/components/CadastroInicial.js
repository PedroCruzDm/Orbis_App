import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Appearance,
  Platform,
} from 'react-native';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CadastroInicial() {
  const colorScheme = Appearance.getColorScheme();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [apelido, setApelido] = useState('');
  const [idade, setIdade] = useState('');
  const [eventoFixo, setEventoFixo] = useState('');

  const [receberNotificacoes, setReceberNotificacoes] = useState(true);
  const [ativarGameXP, setAtivarGameXP] = useState(false);
  const [ativarModoSono, setAtivarModoSono] = useState(true);

  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!nome.trim()) e.nome = 'Por favor, insira seu nome.';
    if (!email.trim()) e.email = 'Por favor, insira seu e-mail.';
    else if (!emailRegex.test(email)) e.email = 'E-mail inválido.';

    if (idade) {
      const n = Number(idade);
      if (Number.isNaN(n) || n < 0 || n > 120) e.idade = 'Idade deve ser entre 0 e 120.';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) {
      Alert.alert('Corrija os erros antes de continuar');
      return;
    }

    const payload = {
      nome: nome.trim(),
      email: email.trim(),
      apelido: apelido.trim(),
      idade: idade ? Number(idade) : null,
      eventoFixo: eventoFixo.trim() || null,
      receberNotificacoes,
      ativarGameXP,
      ativarModoSono,
    };

    Alert.alert('Cadastro', 'Dados enviados com sucesso');
    console.log('Cadastro payload:', payload);
  }

  const styles = createStyles(colorScheme === 'dark');

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Crie sua Conta Orbis</Text>
        <Text style={styles.subtitle}>Preencha os dados abaixo para começar sua jornada de bem-estar.</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Nome *</Text>
        <TextInput
          style={[styles.input, errors.nome && styles.inputError]}
          placeholder="Seu nome completo"
          value={nome}
          onChangeText={setNome}
          autoComplete={Platform.OS === 'web' ? 'name' : 'name'}
          placeholderTextColor={styles.placeholder.color}
        />
        {errors.nome && <Text style={styles.errorText}>{errors.nome}</Text>}

        <Text style={styles.label}>E-mail *</Text>
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          placeholder="seunome@exemplo.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete={Platform.OS === 'web' ? 'email' : 'email'}
          placeholderTextColor={styles.placeholder.color}
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

        <Text style={styles.label}>Apelido (Opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Nome para ranking e perfil"
          value={apelido}
          onChangeText={setApelido}
          placeholderTextColor={styles.placeholder.color}
        />

        <Text style={styles.label}>Idade (Opcional)</Text>
        <TextInput
          style={[styles.input, errors.idade && styles.inputError]}
          placeholder="Sua idade"
          value={idade}
          onChangeText={(t) => setIdade(t.replace(/[^0-9]/g, ''))}
          keyboardType="numeric"
          placeholderTextColor={styles.placeholder.color}
          maxLength={3}
        />
        {errors.idade && <Text style={styles.errorText}>{errors.idade}</Text>}

        <Text style={styles.label}>Compromisso Fixo Principal (Opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Trabalho, Faculdade (Horário Fixo)"
          value={eventoFixo}
          onChangeText={setEventoFixo}
          placeholderTextColor={styles.placeholder.color}
        />

        <View style={styles.rowSpace}>
          <View>
            <Text style={styles.label}>Deseja receber Notificações Inteligentes?</Text>
            <Text style={styles.description}>Inclui resumo diário e lembretes antecipados de eventos.</Text>
          </View>
          <Switch value={receberNotificacoes} onValueChange={setReceberNotificacoes} />
        </View>

        <View style={styles.group}>
          <Text style={styles.label}>Ativar Ferramentas Opcionais</Text>

          <View style={styles.rowSpace}>
            <View style={{flex:1}}>
              <Text style={styles.checkboxLabel}>Ativar Modo Game XP (Gamificação)</Text>
              <Text style={styles.description}>Ganhe XP, Níveis e Moedas Virtuais ao completar tarefas.</Text>
            </View>
            <Switch value={ativarGameXP} onValueChange={setAtivarGameXP} />
          </View>

          <View style={styles.rowSpace}>
            <View style={{flex:1}}>
              <Text style={styles.checkboxLabel}>Ativar Gestão Inteligente do Sono</Text>
              <Text style={styles.description}>Monitoramento de ciclos, análise de qualidade e Despertador Inteligente.</Text>
            </View>
            <Switch value={ativarModoSono} onValueChange={setAtivarModoSono} />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, !(nome && email) && styles.buttonDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.8}
          disabled={!(nome && email)}
        >
          <Text style={styles.buttonText}>Criar Minha Rotina</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function createStyles(dark) {
  const titleColor = dark ? '#F8FAFC' : '#1E3A8A';
  const subtitleColor = dark ? '#94A3B8' : '#9CA3AF';
  const background = dark ? '#0B1220' : '#FFFFFF';

  return StyleSheet.create({
    container: {
      padding: 20,
      paddingTop: 40,
      backgroundColor: background,
      flexGrow: 1,
    },
    header: {
      marginBottom: 20,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: titleColor,
      marginBottom: 6,
    },
    subtitle: {
      color: subtitleColor,
      fontSize: 14,
    },
    form: {
      marginTop: 6,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      marginTop: 12,
      marginBottom: 6,
      color: dark ? '#E6EEF8' : '#0F172A',
    },
    input: {
      borderWidth: 1,
      borderColor: dark ? '#1F2937' : '#E5E7EB',
      padding: 10,
      borderRadius: 8,
      color: dark ? '#E6EEF8' : '#0F172A',
      backgroundColor: dark ? '#071027' : '#FFFFFF',
    },
    inputError: {
      borderColor: '#DC2626',
    },
    errorText: {
      color: '#DC2626',
      marginTop: 6,
    },
    description: {
      color: subtitleColor,
      fontSize: 12,
      marginTop: 2,
    },
    rowSpace: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 12,
    },
    group: {
      marginTop: 14,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: dark ? '#111827' : '#F3F4F6',
    },
    checkboxLabel: {
      fontWeight: '600',
      color: dark ? '#E6EEF8' : '#0F172A',
    },
    button: {
      marginTop: 24,
      backgroundColor: '#2563EB',
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
    },
    buttonDisabled: {
      backgroundColor: '#93C5FD',
      opacity: 0.9,
    },
    buttonText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 16,
    },
    placeholder: {
      color: dark ? '#9CA3AF' : '#9CA3AF',
    },
  });
}
