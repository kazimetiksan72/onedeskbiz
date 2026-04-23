import { useMemo, useState } from 'react';
import axios from 'axios';
import QRCode from 'react-native-qrcode-svg';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

type UserRole = 'ADMIN' | 'EMPLOYEE';

type AuthUser = {
  _id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  phone?: string;
  title?: string;
  workEmail?: string;
  businessCard?: {
    displayName?: string;
    title?: string;
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
    bio?: string;
    avatarPublicUrl?: string;
  };
};

type LoginResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

type PublicCardResponse = {
  userId?: string;
  firstName: string;
  lastName: string;
  businessCard: {
    displayName?: string;
    title?: string;
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
    bio?: string;
    avatarPublicUrl?: string;
  };
};

type CompanyBillingResponse = {
  companyName?: string;
  website?: string;
  billingInfo?: {
    legalCompanyName?: string;
    taxNumber?: string;
    taxOffice?: string;
    billingEmail?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    postalCode?: string;
    bankAccounts?: Array<{
      bankName?: string;
      branchName?: string;
      iban?: string;
      swiftCode?: string;
    }>;
  };
};

function cardFromSessionUser(user: AuthUser): PublicCardResponse {
  return {
    userId: user._id,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    businessCard: {
      displayName: user.businessCard?.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      title: user.businessCard?.title || user.title || '',
      phone: user.businessCard?.phone || user.phone || '',
      email: user.businessCard?.email || user.workEmail || user.email || '',
      website: user.businessCard?.website || '',
      address: user.businessCard?.address || '',
      bio: user.businessCard?.bio || '',
      avatarPublicUrl: user.businessCard?.avatarPublicUrl || ''
    }
  };
}

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://onedesk.azurewebsites.net/api',
  timeout: 15000
});

function escapeVCardValue(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function buildVCard(data: PublicCardResponse) {
  const card = data.businessCard || {};
  const fullName = card.displayName || `${data.firstName || ''} ${data.lastName || ''}`.trim();
  const [firstName = '', ...rest] = fullName.split(' ');
  const lastName = rest.join(' ');

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeVCardValue(lastName)};${escapeVCardValue(firstName)};;;`,
    `FN:${escapeVCardValue(fullName)}`
  ];

  if (card.title) lines.push(`TITLE:${escapeVCardValue(card.title)}`);
  if (card.phone) lines.push(`TEL;TYPE=CELL:${escapeVCardValue(card.phone)}`);
  if (card.email) lines.push(`EMAIL;TYPE=INTERNET:${escapeVCardValue(card.email)}`);
  if (card.website) lines.push(`URL:${escapeVCardValue(card.website)}`);
  if (card.address) lines.push(`ADR;TYPE=WORK:;;${escapeVCardValue(card.address)};;;;`);
  if (card.bio) lines.push(`NOTE:${escapeVCardValue(card.bio)}`);
  if (card.avatarPublicUrl) lines.push(`PHOTO;VALUE=uri:${escapeVCardValue(card.avatarPublicUrl)}`);

  lines.push('END:VCARD');
  return lines.join('\n');
}

function buildBillingQrText(data: CompanyBillingResponse | null) {
  if (!data) return '';

  const info = data.billingInfo || {};
  const lines = [
    `Company: ${data.companyName || ''}`,
    `Legal Name: ${info.legalCompanyName || ''}`,
    `Tax Number: ${info.taxNumber || ''}`,
    `Tax Office: ${info.taxOffice || ''}`,
    `Address: ${info.address || ''}`,
    `City: ${info.city || ''}`,
    `Country: ${info.country || ''}`,
    `Postal Code: ${info.postalCode || ''}`
  ];

  (info.bankAccounts || []).forEach((account, index) => {
    lines.push(`Bank ${index + 1}: ${account.bankName || ''}`);
    lines.push(`Branch ${index + 1}: ${account.branchName || ''}`);
    lines.push(`IBAN ${index + 1}: ${account.iban || ''}`);
    lines.push(`SWIFT ${index + 1}: ${account.swiftCode || ''}`);
  });

  return lines.join('\n').trim();
}

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [session, setSession] = useState<LoginResponse | null>(null);
  const [cardData, setCardData] = useState<PublicCardResponse | null>(null);
  const [cardVisible, setCardVisible] = useState(false);
  const [billingData, setBillingData] = useState<CompanyBillingResponse | null>(null);
  const [billingVisible, setBillingVisible] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);

  const vCardText = useMemo(() => (cardData ? buildVCard(cardData) : ''), [cardData]);
  const billingQrText = useMemo(() => buildBillingQrText(billingData), [billingData]);

  const login = async () => {
    setError('');
    setIsLoading(true);

    try {
      const { data } = await api.post<LoginResponse>('/auth/login', {
        email: email.trim().toLowerCase(),
        password
      });

      if (data.user.role !== 'EMPLOYEE') {
        setError('Bu mobil uygulama sadece employee girişi içindir.');
        setSession(null);
        return;
      }

      setSession(data);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Giriş başarısız. Bilgileri kontrol edin.');
    } finally {
      setIsLoading(false);
    }
  };

  const openDigitalCard = async () => {
    if (!session?.user._id) return;

    setError('');
    setIsLoading(true);

    try {
      const { data } = await api.get<PublicCardResponse>(`/digital-cards/public/${session.user._id}`);
      setCardData(data);
      setCardVisible(true);
    } catch (requestError: any) {
      if (requestError?.response?.status === 404) {
        setCardData(cardFromSessionUser(session.user));
        setCardVisible(true);
      } else {
        setError(requestError?.response?.data?.message || 'Dijital kartvizit yüklenemedi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const openBillingInfo = async () => {
    setError('');
    setBillingLoading(true);

    try {
      const { data } = await api.get<CompanyBillingResponse>('/company-settings/public-billing');
      setBillingData(data);
      setBillingVisible(true);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Firma fatura bilgileri yüklenemedi.');
    } finally {
      setBillingLoading(false);
    }
  };

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.card}>
          <Text style={styles.title}>Sign In</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            secureTextEntry
            onChangeText={setPassword}
          />
          <Pressable style={styles.primaryButton} onPress={login} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
          </Pressable>
          <Text style={styles.hint}>
            API: {process.env.EXPO_PUBLIC_API_BASE_URL || 'https://onedesk.azurewebsites.net/api'}
          </Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.card}>
        <Text style={styles.title}>Hoş geldin</Text>
        <Text style={styles.subtitle}>{session.user.email}</Text>

        <Pressable style={styles.primaryButton} onPress={openDigitalCard} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Dijital Kartviziti Aç</Text>
          )}
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={openBillingInfo} disabled={billingLoading}>
          {billingLoading ? (
            <ActivityIndicator color="#111827" />
          ) : (
            <Text style={styles.secondaryButtonText}>Firma Fatura Bilgileri</Text>
          )}
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => {
            setSession(null);
            setCardData(null);
            setCardVisible(false);
          }}
        >
          <Text style={styles.secondaryButtonText}>Çıkış Yap</Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <Modal visible={cardVisible} transparent animationType="slide" onRequestClose={() => setCardVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {cardData?.businessCard.displayName ||
                `${cardData?.firstName || ''} ${cardData?.lastName || ''}`.trim()}
            </Text>
            <Text style={styles.modalSubtitle}>{cardData?.businessCard.title || ''}</Text>
            {vCardText ? <QRCode value={vCardText} size={220} /> : null}
            <Pressable style={styles.secondaryButton} onPress={() => setCardVisible(false)}>
              <Text style={styles.secondaryButtonText}>Kapat</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={billingVisible} transparent animationType="slide" onRequestClose={() => setBillingVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.billingBlock}>
              <Text style={styles.billingLegalName}>{billingData?.billingInfo?.legalCompanyName || '-'}</Text>
              <Text style={styles.billingLine}>{billingData?.billingInfo?.taxNumber || '-'}</Text>
              <Text style={styles.billingLine}>{billingData?.billingInfo?.taxOffice || '-'}</Text>
              <Text style={styles.billingLine}>{billingData?.billingInfo?.address || '-'}</Text>
            </View>

            <Text style={styles.billingSectionTitle}>Banka Bilgileri</Text>
            {(billingData?.billingInfo?.bankAccounts || []).map((account, index) => (
              <View key={`${account.iban || 'bank'}-${index}`} style={styles.billingBlock}>
                <Text style={styles.billingLine}>Bank: {account.bankName || '-'}</Text>
                <Text style={styles.billingLine}>Branch: {account.branchName || '-'}</Text>
                <Text style={styles.billingLine}>IBAN: {account.iban || '-'}</Text>
                <Text style={styles.billingLine}>SWIFT: {account.swiftCode || '-'}</Text>
              </View>
            ))}

            {billingQrText ? <QRCode value={billingQrText} size={220} /> : null}

            <Pressable style={styles.secondaryButton} onPress={() => setBillingVisible(false)}>
              <Text style={styles.secondaryButtonText}>Kapat</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    padding: 16
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    gap: 12
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827'
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280'
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff'
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600'
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center'
  },
  secondaryButtonText: {
    color: '#0f172a',
    fontWeight: '600'
  },
  error: {
    color: '#b91c1c',
    fontSize: 13
  },
  hint: {
    fontSize: 12,
    color: '#64748b'
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'center',
    padding: 20
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
    padding: 16
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827'
  },
  modalSubtitle: {
    color: '#64748b',
    marginBottom: 4
  },
  billingBlock: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 10,
    gap: 4
  },
  billingLine: {
    fontSize: 12,
    color: '#0f172a'
  },
  billingLegalName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a'
  },
  billingSectionTitle: {
    width: '100%',
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a'
  }
});
