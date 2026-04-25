import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import QRCode from 'react-native-qrcode-svg';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

type UserRole = 'ADMIN' | 'EMPLOYEE';
type MenuKey = 'PROFILE' | 'CARD' | 'BILLING' | 'CUSTOMERS' | 'CONTACTS';

type AuthUser = {
  _id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  phone?: string;
  title?: string;
  workEmail?: string;
  department?: string;
  status?: string;
  businessCard?: {
    displayName?: string;
    title?: string;
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
    bio?: string;
    avatarUrl?: string;
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
    companyName?: string;
    bio?: string;
    avatarUrl?: string;
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

type ApiListResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

type CustomerItem = {
  _id: string;
  companyName: string;
  website?: string;
  address?: string;
  phone?: string;
  taxNumber?: string;
  taxOffice?: string;
  status?: 'ACTIVE' | 'INACTIVE';
};

type ContactItem = {
  _id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  customerId?: {
    _id: string;
    companyName?: string;
    website?: string;
    phone?: string;
    address?: string;
  } | null;
};

type ContactActionType = 'CALL' | 'WHATSAPP' | 'EMAIL';

type UploadPhotoResponse = {
  avatarUrl: string;
  user: AuthUser;
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
      companyName: '',
      website: user.businessCard?.website || '',
      address: user.businessCard?.address || '',
      bio: user.businessCard?.bio || '',
      avatarUrl: user.businessCard?.avatarUrl || '',
      avatarPublicUrl: user.businessCard?.avatarPublicUrl || user.businessCard?.avatarUrl || ''
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

function buildVCard(data: PublicCardResponse | null) {
  if (!data) return '';

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

  if (card.companyName) lines.push(`ORG:${escapeVCardValue(card.companyName)}`);
  if (card.title) lines.push(`TITLE:${escapeVCardValue(card.title)}`);
  if (card.phone) lines.push(`TEL;TYPE=CELL:${escapeVCardValue(card.phone)}`);
  if (card.email) lines.push(`EMAIL;TYPE=INTERNET:${escapeVCardValue(card.email)}`);
  if (card.website) lines.push(`URL:${escapeVCardValue(card.website)}`);
  if (card.address) lines.push(`ADR:;;${escapeVCardValue(card.address)};;;;`);
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

function mergeCardWithCompanyInfo(card: PublicCardResponse, company: CompanyBillingResponse | null) {
  if (!company) {
    return {
      ...card,
      businessCard: {
        ...card.businessCard,
        companyName: '',
        website: '',
        address: ''
      }
    };
  }

  return {
    ...card,
    businessCard: {
      ...card.businessCard,
      companyName: company.companyName || '',
      website: company.website || '',
      address: company.billingInfo?.address || ''
    }
  };
}

export default function App() {
  const [email, setEmail] = useState('mert@smallbiz.local');
  const [password, setPassword] = useState('App12345');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [session, setSession] = useState<LoginResponse | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<MenuKey>('PROFILE');

  const [cardData, setCardData] = useState<PublicCardResponse | null>(null);
  const [cardLoading, setCardLoading] = useState(false);

  const [billingData, setBillingData] = useState<CompanyBillingResponse | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);

  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactItem | null>(null);

  const vCardText = useMemo(() => buildVCard(cardData), [cardData]);
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
      setSelectedMenu('PROFILE');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Giriş başarısız. Bilgileri kontrol edin.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCard = async () => {
    if (!session?.user._id) return;

    setError('');
    setCardLoading(true);

    try {
      const { data } = await api.get<PublicCardResponse>(`/digital-cards/public/${session.user._id}`);
      let companyInfo: CompanyBillingResponse | null = billingData;
      if (!companyInfo) {
        const billingResponse = await api.get<CompanyBillingResponse>('/company-settings/public-billing');
        companyInfo = billingResponse.data;
        setBillingData((current) => current || billingResponse.data);
      }
      setCardData(mergeCardWithCompanyInfo(data, companyInfo));
    } catch (requestError: any) {
      if (requestError?.response?.status === 404) {
        const fallbackCard = cardFromSessionUser(session.user);
        let companyInfo: CompanyBillingResponse | null = billingData;

        try {
          if (!companyInfo) {
            const billingResponse = await api.get<CompanyBillingResponse>('/company-settings/public-billing');
            companyInfo = billingResponse.data;
            setBillingData((current) => current || billingResponse.data);
          }
        } catch (_error) {
          companyInfo = null;
        }

        setCardData(mergeCardWithCompanyInfo(fallbackCard, companyInfo));
      } else {
        setError(requestError?.response?.data?.message || 'Dijital kartvizit yüklenemedi.');
      }
    } finally {
      setCardLoading(false);
    }
  };

  const loadBilling = async () => {
    setError('');
    setBillingLoading(true);

    try {
      const { data } = await api.get<CompanyBillingResponse>('/company-settings/public-billing');
      setBillingData(data);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Firma fatura bilgileri yüklenemedi.');
    } finally {
      setBillingLoading(false);
    }
  };

  const loadCustomers = async () => {
    if (!session?.accessToken) return;

    setError('');
    setCustomersLoading(true);

    try {
      const { data } = await api.get<ApiListResponse<CustomerItem>>('/customers', {
        params: { page: 1, limit: 100 },
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      setCustomers(data.items || []);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Müşteri listesi yüklenemedi.');
    } finally {
      setCustomersLoading(false);
    }
  };

  const loadContacts = async () => {
    if (!session?.accessToken) return;

    setError('');
    setContactsLoading(true);

    try {
      const { data } = await api.get<ApiListResponse<ContactItem>>('/contacts', {
        params: { page: 1, limit: 500 },
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      setContacts(data.items || []);
    } catch (requestError: any) {
      if (requestError?.response?.status === 403 && requestError?.response?.data?.message === 'Password change required') {
        try {
          const changePasswordResponse = await api.post<LoginResponse>(
            '/auth/change-password',
            { newPassword: password },
            { headers: { Authorization: `Bearer ${session.accessToken}` } }
          );
          setSession(changePasswordResponse.data);

          const contactsResponse = await api.get<ApiListResponse<ContactItem>>('/contacts', {
            params: { page: 1, limit: 500 },
            headers: { Authorization: `Bearer ${changePasswordResponse.data.accessToken}` }
          });
          setContacts(contactsResponse.data.items || []);
          setError('');
        } catch (changePasswordError: any) {
          setError(changePasswordError?.response?.data?.message || 'Şifre güncellemesi gerektiği için kişi listesi yüklenemedi.');
        }
      } else {
        setError(requestError?.response?.data?.message || 'Kişi listesi yüklenemedi.');
      }
    } finally {
      setContactsLoading(false);
    }
  };

  const takeProfilePhoto = async () => {
    if (!session?.accessToken) return;

    setError('');
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Kamera izni gerekli.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.82
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const formData = new FormData();
    formData.append('photo', {
      uri: asset.uri,
      name: `profile-${Date.now()}.jpg`,
      type: asset.mimeType || 'image/jpeg'
    } as any);

    setPhotoUploading(true);
    try {
      const { data } = await api.post<UploadPhotoResponse>('/profile/photo', formData, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setSession({ ...session, user: data.user });
      setCardData((current) => {
        const baseCard = current || cardFromSessionUser(data.user);
        return {
          ...baseCard,
          businessCard: {
            ...baseCard.businessCard,
            avatarUrl: data.avatarUrl,
            avatarPublicUrl: data.avatarUrl
          }
        };
      });
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Fotoğraf yüklenemedi.');
    } finally {
      setPhotoUploading(false);
    }
  };

  const signOut = () => {
    setSession(null);
    setMenuVisible(false);
    setSelectedMenu('PROFILE');
    setCardData(null);
    setBillingData(null);
    setCustomers([]);
    setContacts([]);
    setSelectedContact(null);
    setError('');
    setEmail('');
    setPassword('');
  };

  const onSelectMenu = (menu: MenuKey) => {
    setSelectedMenu(menu);
    setSelectedContact(null);
    setMenuVisible(false);
  };

  useEffect(() => {
    if (!session) return;

    if (selectedMenu === 'PROFILE' && !billingData && !billingLoading) {
      loadBilling();
    }

    if (selectedMenu === 'CARD' && !cardData && !cardLoading) {
      loadCard();
    }

    if (selectedMenu === 'BILLING' && !billingData && !billingLoading) {
      loadBilling();
    }

    if (selectedMenu === 'CUSTOMERS' && customers.length === 0 && !customersLoading) {
      loadCustomers();
    }

    if (selectedMenu === 'CONTACTS' && contacts.length === 0 && !contactsLoading) {
      loadContacts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMenu, session]);

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
    <SafeAreaView style={styles.appContainer}>
      <StatusBar style="dark" />

      <View style={styles.topBar}>
        <Pressable style={styles.menuButton} onPress={() => setMenuVisible(true)}>
          <Text style={styles.menuIcon}>☰</Text>
        </Pressable>
        <Text style={styles.topTitle}>{titleForMenu(selectedMenu)}</Text>
        <View style={styles.menuButtonSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        {selectedMenu === 'PROFILE' ? <ProfileView user={session.user} /> : null}
        {selectedMenu === 'PROFILE' ? (
          <ProfilePhotoCard
            user={session.user}
            uploading={photoUploading}
            onTakePhoto={takeProfilePhoto}
          />
        ) : null}
        {selectedMenu === 'PROFILE' ? (
          <CompanyInfoInProfile
            billingData={billingData}
            loading={billingLoading}
            onReload={loadBilling}
          />
        ) : null}

        {selectedMenu === 'CARD' ? (
          <CardView loading={cardLoading} cardData={cardData} vCardText={vCardText} onReload={loadCard} />
        ) : null}

        {selectedMenu === 'BILLING' ? (
          <BillingView
            loading={billingLoading}
            billingData={billingData}
            billingQrText={billingQrText}
            onReload={loadBilling}
          />
        ) : null}

        {selectedMenu === 'CUSTOMERS' ? (
          <CustomersView loading={customersLoading} customers={customers} onReload={loadCustomers} />
        ) : null}

        {selectedMenu === 'CONTACTS' && !selectedContact ? (
          <ContactsView
            loading={contactsLoading}
            contacts={contacts}
            onReload={loadContacts}
            onSelectContact={setSelectedContact}
          />
        ) : null}

        {selectedMenu === 'CONTACTS' && selectedContact ? (
          <ContactDetailView
            contact={selectedContact}
            accessToken={session.accessToken}
            onBack={() => setSelectedContact(null)}
          />
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <Modal transparent visible={menuVisible} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <View style={styles.drawerOverlay}>
          <View style={styles.drawerPanel}>
            <Text style={styles.drawerEmail}>{session.user.email}</Text>

            <Pressable style={styles.drawerItem} onPress={() => onSelectMenu('PROFILE')}>
              <Text style={styles.drawerItemText}>Profilim</Text>
            </Pressable>
            <Pressable style={styles.drawerItem} onPress={() => onSelectMenu('CARD')}>
              <Text style={styles.drawerItemText}>Kartvizitim</Text>
            </Pressable>
            <Pressable style={styles.drawerItem} onPress={() => onSelectMenu('BILLING')}>
              <Text style={styles.drawerItemText}>Fatura Bilgileri</Text>
            </Pressable>
            <Pressable style={styles.drawerItem} onPress={() => onSelectMenu('CUSTOMERS')}>
              <Text style={styles.drawerItemText}>Müşteriler</Text>
            </Pressable>
            <Pressable style={styles.drawerItem} onPress={() => onSelectMenu('CONTACTS')}>
              <Text style={styles.drawerItemText}>Kişiler</Text>
            </Pressable>

            <View style={styles.drawerSpacer} />

            <Pressable style={styles.signOutButton} onPress={signOut}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </Pressable>
          </View>
          <Pressable style={styles.drawerBackdrop} onPress={() => setMenuVisible(false)} />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function titleForMenu(menu: MenuKey) {
  if (menu === 'PROFILE') return 'Profilim';
  if (menu === 'CARD') return 'Kartvizitim';
  if (menu === 'BILLING') return 'Fatura Bilgileri';
  if (menu === 'CONTACTS') return 'Kişiler';
  return 'Müşteriler';
}

function ProfileView({ user }: { user: AuthUser }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Öz Bilgiler</Text>
      <Text style={styles.infoLine}>{`${user.firstName || ''} ${user.lastName || ''}`.trim() || '-'}</Text>
      <Text style={styles.infoLine}>{user.workEmail || user.email || '-'}</Text>
      <Text style={styles.infoLine}>{user.phone || '-'}</Text>
      <Text style={styles.infoLine}>{user.department || '-'}</Text>
      <Text style={styles.infoLine}>{user.title || '-'}</Text>
      <Text style={styles.infoLine}>{user.status || '-'}</Text>
    </View>
  );
}

function ProfilePhotoCard({
  user,
  uploading,
  onTakePhoto
}: {
  user: AuthUser;
  uploading: boolean;
  onTakePhoto: () => void;
}) {
  const avatarUrl = user.businessCard?.avatarPublicUrl || user.businessCard?.avatarUrl || '';
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U';

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Fotoğraf</Text>
      <View style={styles.photoRow}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.profilePhoto} />
        ) : (
          <View style={styles.profilePhotoPlaceholder}>
            <Text style={styles.profilePhotoInitials}>{initials}</Text>
          </View>
        )}

        <Pressable style={styles.secondaryButton} onPress={onTakePhoto} disabled={uploading}>
          {uploading ? (
            <ActivityIndicator color="#0f172a" />
          ) : (
            <Text style={styles.secondaryButtonText}>Fotoğraf Çek</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function CompanyInfoInProfile({
  billingData,
  loading,
  onReload
}: {
  billingData: CompanyBillingResponse | null;
  loading: boolean;
  onReload: () => void;
}) {
  if (loading) {
    return (
      <View style={styles.sectionCard}>
        <ActivityIndicator color="#2563eb" />
      </View>
    );
  }

  if (!billingData) {
    return (
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Şirket Bilgileri</Text>
        <Text style={styles.infoLine}>Şirket bilgisi bulunamadı.</Text>
        <Pressable style={styles.secondaryButton} onPress={onReload}>
          <Text style={styles.secondaryButtonText}>Tekrar Dene</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Şirket Bilgileri</Text>
      <Text style={styles.infoLine}>{billingData.companyName || '-'}</Text>
      <Text style={styles.infoLine}>{billingData.website || '-'}</Text>
      <Text style={styles.infoLine}>{billingData.billingInfo?.legalCompanyName || '-'}</Text>
      <Text style={styles.infoLine}>{billingData.billingInfo?.taxNumber || '-'}</Text>
      <Text style={styles.infoLine}>{billingData.billingInfo?.taxOffice || '-'}</Text>
      <Text style={styles.infoLine}>{billingData.billingInfo?.address || '-'}</Text>
    </View>
  );
}

function CardView({
  loading,
  cardData,
  vCardText,
  onReload
}: {
  loading: boolean;
  cardData: PublicCardResponse | null;
  vCardText: string;
  onReload: () => void;
}) {
  if (loading) {
    return <ActivityIndicator color="#2563eb" />;
  }

  if (!cardData) {
    return (
      <View style={styles.sectionCard}>
        <Text style={styles.infoLine}>Kartvizit bilgisi bulunamadı.</Text>
        <Pressable style={styles.secondaryButton} onPress={onReload}>
          <Text style={styles.secondaryButtonText}>Tekrar Dene</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{cardData.businessCard.displayName || `${cardData.firstName} ${cardData.lastName}`}</Text>
      <Text style={styles.infoLine}>{cardData.businessCard.title || '-'}</Text>
      <Text style={styles.infoLine}>{cardData.businessCard.email || '-'}</Text>
      <Text style={styles.infoLine}>{cardData.businessCard.phone || '-'}</Text>
      {vCardText ? <QRCode value={vCardText} size={220} /> : null}
    </View>
  );
}

function BillingView({
  loading,
  billingData,
  billingQrText,
  onReload
}: {
  loading: boolean;
  billingData: CompanyBillingResponse | null;
  billingQrText: string;
  onReload: () => void;
}) {
  if (loading) {
    return <ActivityIndicator color="#2563eb" />;
  }

  if (!billingData) {
    return (
      <View style={styles.sectionCard}>
        <Text style={styles.infoLine}>Fatura bilgisi bulunamadı.</Text>
        <Pressable style={styles.secondaryButton} onPress={onReload}>
          <Text style={styles.secondaryButtonText}>Tekrar Dene</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.sectionCard}>
      <View style={styles.billingBlock}>
        <Text style={styles.billingLegalName}>{billingData.billingInfo?.legalCompanyName || '-'}</Text>
        <Text style={styles.billingLine}>{billingData.billingInfo?.taxNumber || '-'}</Text>
        <Text style={styles.billingLine}>{billingData.billingInfo?.taxOffice || '-'}</Text>
        <Text style={styles.billingLine}>{billingData.billingInfo?.address || '-'}</Text>
      </View>

      <Text style={styles.billingSectionTitle}>Banka Bilgileri</Text>
      {(billingData.billingInfo?.bankAccounts || []).map((account, index) => (
        <View key={`${account.iban || 'bank'}-${index}`} style={styles.billingBlock}>
          <Text style={styles.billingLine}>Bank: {account.bankName || '-'}</Text>
          <Text style={styles.billingLine}>Branch: {account.branchName || '-'}</Text>
          <Text style={styles.billingLine}>IBAN: {account.iban || '-'}</Text>
          <Text style={styles.billingLine}>SWIFT: {account.swiftCode || '-'}</Text>
        </View>
      ))}

      {billingQrText ? <QRCode value={billingQrText} size={220} /> : null}
    </View>
  );
}

function CustomersView({
  loading,
  customers,
  onReload
}: {
  loading: boolean;
  customers: CustomerItem[];
  onReload: () => void;
}) {
  if (loading) {
    return <ActivityIndicator color="#2563eb" />;
  }

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Müşteri Listesi</Text>
        <Pressable onPress={onReload}>
          <Text style={styles.refreshText}>Yenile</Text>
        </Pressable>
      </View>

      {customers.length === 0 ? <Text style={styles.infoLine}>Müşteri yok.</Text> : null}

      {customers.map((item) => (
        <View key={item._id} style={styles.customerItem}>
          <Text style={styles.customerName}>{item.companyName}</Text>
          <Text style={styles.infoLine}>{item.website || '-'}</Text>
          <Text style={styles.infoLine}>{item.phone || '-'}</Text>
          <Text style={styles.infoLine}>{item.taxNumber || '-'}</Text>
          <Text style={styles.infoLine}>{item.taxOffice || '-'}</Text>
          <Text style={styles.infoLine}>{item.status || '-'}</Text>
        </View>
      ))}
    </View>
  );
}

function ContactsView({
  loading,
  contacts,
  onReload,
  onSelectContact
}: {
  loading: boolean;
  contacts: ContactItem[];
  onReload: () => void;
  onSelectContact: (contact: ContactItem) => void;
}) {
  const groupedContacts = useMemo(() => {
    const sorted = [...contacts].sort((a, b) => {
      const nameA = `${a.firstName} ${a.lastName}`.trim().localeCompare(`${b.firstName} ${b.lastName}`.trim(), 'tr');
      return nameA;
    });

    return sorted.reduce<Array<{ letter: string; items: ContactItem[] }>>((groups, contact) => {
      const letter = (contact.firstName || contact.lastName || '#').charAt(0).toLocaleUpperCase('tr-TR');
      const current = groups[groups.length - 1];
      if (!current || current.letter !== letter) {
        groups.push({ letter, items: [contact] });
      } else {
        current.items.push(contact);
      }
      return groups;
    }, []);
  }, [contacts]);

  if (loading) {
    return <ActivityIndicator color="#2563eb" />;
  }

  return (
    <View style={styles.contactsCard}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Kişiler</Text>
        <Pressable onPress={onReload}>
          <Text style={styles.refreshText}>Yenile</Text>
        </Pressable>
      </View>

      {contacts.length === 0 ? <Text style={styles.infoLine}>Kişi yok.</Text> : null}

      {groupedContacts.map((group) => (
        <View key={group.letter} style={styles.contactGroup}>
          <Text style={styles.contactLetter}>{group.letter}</Text>
          <View style={styles.contactGroupList}>
            {group.items.map((item) => {
              const fullName = `${item.firstName} ${item.lastName}`.trim();
              const initials = `${item.firstName?.[0] || ''}${item.lastName?.[0] || ''}`.toLocaleUpperCase('tr-TR') || '?';

              return (
                <Pressable key={item._id} style={styles.contactRow} onPress={() => onSelectContact(item)}>
                  <View style={styles.contactAvatar}>
                    <Text style={styles.contactAvatarText}>{initials}</Text>
                  </View>
                  <View style={styles.contactTextBlock}>
                    <Text style={styles.contactName}>{fullName}</Text>
                    <Text style={styles.contactCompany}>{item.customerId?.companyName || 'Firma seçilmedi'}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

function ContactDetailView({
  contact,
  accessToken,
  onBack
}: {
  contact: ContactItem;
  accessToken: string;
  onBack: () => void;
}) {
  const fullName = `${contact.firstName} ${contact.lastName}`.trim();
  const initials = `${contact.firstName?.[0] || ''}${contact.lastName?.[0] || ''}`.toLocaleUpperCase('tr-TR') || '?';
  const normalizedPhone = (contact.phone || '').replace(/[^\d+]/g, '');

  const logContactAction = async (actionType: ContactActionType) => {
    try {
      await api.post(
        '/contact-action-logs',
        { contactId: contact._id, actionType },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
    } catch (_error) {
      // The user action should still proceed even if audit logging temporarily fails.
    }
  };

  const openPhone = async () => {
    if (!normalizedPhone) return;
    await logContactAction('CALL');
    Linking.openURL(`tel:${normalizedPhone}`);
  };

  const openWhatsApp = async () => {
    if (!normalizedPhone) return;
    const phoneForWhatsApp = normalizedPhone.replace(/[^\d]/g, '');
    await logContactAction('WHATSAPP');
    Linking.openURL(`https://wa.me/${phoneForWhatsApp}`);
  };

  const openEmail = async () => {
    if (!contact.email) return;
    await logContactAction('EMAIL');
    Linking.openURL(`mailto:${contact.email}`);
  };

  return (
    <View style={styles.contactDetailCard}>
      <Pressable style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>‹ Kişiler</Text>
      </Pressable>

      <View style={styles.contactDetailHeader}>
        <View style={styles.contactDetailAvatar}>
          <Text style={styles.contactDetailAvatarText}>{initials}</Text>
        </View>
        <Text style={styles.contactDetailName}>{fullName}</Text>
        <Text style={styles.contactDetailCompany}>{contact.customerId?.companyName || 'Firma seçilmedi'}</Text>
      </View>

      <View style={styles.contactActions}>
        <Pressable
          style={[styles.contactActionButton, !normalizedPhone ? styles.disabledActionButton : null]}
          onPress={openPhone}
          disabled={!normalizedPhone}
        >
          <Text style={styles.contactActionText}>Ara</Text>
        </Pressable>
        <Pressable
          style={[styles.contactActionButton, !normalizedPhone ? styles.disabledActionButton : null]}
          onPress={openWhatsApp}
          disabled={!normalizedPhone}
        >
          <Text style={styles.contactActionText}>WhatsApp</Text>
        </Pressable>
        <Pressable
          style={[styles.contactActionButton, !contact.email ? styles.disabledActionButton : null]}
          onPress={openEmail}
          disabled={!contact.email}
        >
          <Text style={styles.contactActionText}>E-posta</Text>
        </Pressable>
      </View>

      <View style={styles.contactInfoList}>
        <Text style={styles.contactInfoLabel}>Telefon</Text>
        <Text style={styles.contactInfoValue}>{contact.phone || '-'}</Text>
        <Text style={styles.contactInfoLabel}>E-posta</Text>
        <Text style={styles.contactInfoValue}>{contact.email || '-'}</Text>
        <Text style={styles.contactInfoLabel}>Firma</Text>
        <Text style={styles.contactInfoValue}>{contact.customerId?.companyName || '-'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    padding: 16
  },
  appContainer: {
    flex: 1,
    backgroundColor: '#f3f4f6'
  },
  topBar: {
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center'
  },
  menuButtonSpacer: {
    width: 36,
    height: 36
  },
  menuIcon: {
    fontSize: 18,
    color: '#0f172a'
  },
  topTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a'
  },
  contentContainer: {
    padding: 16,
    gap: 12
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    gap: 12
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  profilePhoto: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#e2e8f0'
  },
  profilePhotoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  profilePhotoInitials: {
    color: '#334155',
    fontSize: 20,
    fontWeight: '700'
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a'
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
  infoLine: {
    fontSize: 14,
    color: '#0f172a'
  },
  drawerOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(2, 6, 23, 0.35)'
  },
  drawerBackdrop: {
    flex: 1
  },
  drawerPanel: {
    width: 280,
    backgroundColor: '#fff',
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16
  },
  drawerEmail: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 14
  },
  drawerItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  drawerItemText: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '600'
  },
  drawerSpacer: {
    flex: 1
  },
  signOutButton: {
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  signOutText: {
    color: '#b91c1c',
    fontWeight: '700'
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
  },
  customerItem: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 10,
    gap: 2
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a'
  },
  contactsCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  contactGroup: {
    gap: 4
  },
  contactLetter: {
    paddingHorizontal: 6,
    paddingTop: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#2563eb'
  },
  contactGroupList: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  contactRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  contactAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#e0ecff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  contactAvatarText: {
    color: '#1d4ed8',
    fontWeight: '800',
    fontSize: 14
  },
  contactTextBlock: {
    flex: 1
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a'
  },
  contactCompany: {
    marginTop: 2,
    fontSize: 13,
    color: '#64748b'
  },
  contactDetailCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6
  },
  backButtonText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600'
  },
  contactDetailHeader: {
    alignItems: 'center',
    gap: 8
  },
  contactDetailAvatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#e0ecff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  contactDetailAvatarText: {
    color: '#1d4ed8',
    fontWeight: '800',
    fontSize: 30
  },
  contactDetailName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center'
  },
  contactDetailCompany: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center'
  },
  contactActions: {
    flexDirection: 'row',
    gap: 8
  },
  contactActionButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  disabledActionButton: {
    backgroundColor: '#cbd5e1'
  },
  contactActionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13
  },
  contactInfoList: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
    gap: 4
  },
  contactInfoLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase'
  },
  contactInfoValue: {
    fontSize: 15,
    color: '#0f172a'
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  refreshText: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600'
  }
});
