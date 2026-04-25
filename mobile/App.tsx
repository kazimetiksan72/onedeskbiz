import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import QRCode from 'react-native-qrcode-svg';
import {
  ActivityIndicator,
  Animated,
  Image,
  Linking,
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
type MenuKey = 'HOME' | 'PROFILE' | 'CARD' | 'BILLING' | 'CUSTOMERS' | 'CONTACTS' | 'ACTIONS';

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

type ContactActionLogItem = {
  _id: string;
  actionType: ContactActionType;
  occurredAt: string;
  note?: string;
  noteUpdatedAt?: string | null;
  contactId?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
  };
  customerId?: {
    _id: string;
    companyName?: string;
  } | null;
  contactSnapshot?: {
    fullName?: string;
    phone?: string;
    email?: string;
    companyName?: string;
  };
};

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

  const [selectedMenu, setSelectedMenu] = useState<MenuKey>('HOME');

  const [cardData, setCardData] = useState<PublicCardResponse | null>(null);
  const [cardLoading, setCardLoading] = useState(false);

  const [billingData, setBillingData] = useState<CompanyBillingResponse | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);

  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactItem | null>(null);
  const [actionLogs, setActionLogs] = useState<ContactActionLogItem[]>([]);
  const [actionLogsLoading, setActionLogsLoading] = useState(false);
  const [selectedActionLog, setSelectedActionLog] = useState<ContactActionLogItem | null>(null);

  const vCardText = useMemo(() => buildVCard(cardData), [cardData]);
  const isTabRoot =
    (selectedMenu === 'HOME' || selectedMenu === 'PROFILE' || selectedMenu === 'CARD' || selectedMenu === 'CONTACTS') &&
    !selectedContact &&
    !selectedActionLog;

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
      setSelectedMenu('HOME');
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

  const loadActionLogs = async () => {
    if (!session?.accessToken) return;

    setError('');
    setActionLogsLoading(true);

    try {
      const { data } = await api.get<ApiListResponse<ContactActionLogItem>>('/contact-action-logs', {
        params: { page: 1, limit: 200 },
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      setActionLogs(data.items || []);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Aksiyon kayıtları yüklenemedi.');
    } finally {
      setActionLogsLoading(false);
    }
  };

  const saveActionLogNote = async (logId: string, note: string) => {
    if (!session?.accessToken) return;

    const { data } = await api.patch<ContactActionLogItem>(
      `/contact-action-logs/${logId}/note`,
      { note },
      { headers: { Authorization: `Bearer ${session.accessToken}` } }
    );

    setActionLogs((current) => current.map((item) => (item._id === data._id ? data : item)));
    setSelectedActionLog(data);
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
    setSelectedMenu('HOME');
    setCardData(null);
    setBillingData(null);
    setCustomers([]);
    setContacts([]);
    setSelectedContact(null);
    setActionLogs([]);
    setSelectedActionLog(null);
    setError('');
    setEmail('mert@smallbiz.local');
    setPassword('App12345');
  };

  const onSelectMenu = (menu: MenuKey) => {
    setSelectedMenu(menu);
    setSelectedContact(null);
    setSelectedActionLog(null);
  };

  useEffect(() => {
    if (!session) return;

    if ((selectedMenu === 'HOME' || selectedMenu === 'PROFILE') && !billingData && !billingLoading) {
      loadBilling();
    }

    if (selectedMenu === 'HOME' && !cardData && !cardLoading) {
      loadCard();
    }

    if (selectedMenu === 'HOME' && actionLogs.length === 0 && !actionLogsLoading) {
      loadActionLogs();
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

    if (selectedMenu === 'ACTIONS' && actionLogs.length === 0 && !actionLogsLoading) {
      loadActionLogs();
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

      <View style={styles.appShell}>
        <AppHeader
          title={titleForMenu(selectedMenu)}
          user={session.user}
          showBack={!isTabRoot}
          showSignOut={selectedMenu === 'HOME'}
          onBack={() => {
            if (selectedContact) {
              setSelectedContact(null);
              return;
            }
            if (selectedActionLog) {
              setSelectedActionLog(null);
              return;
            }
            if (selectedMenu === 'ACTIONS') {
              setSelectedMenu('CONTACTS');
              return;
            }
            setSelectedMenu('HOME');
          }}
          onSignOut={signOut}
        />

        <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {selectedMenu === 'HOME' ? (
            <HomeView
              user={session.user}
              cardData={cardData}
              billingData={billingData}
              actionLogs={actionLogs}
              onNavigate={setSelectedMenu}
            />
          ) : null}

          {selectedMenu !== 'HOME' ? (
            <SlideInView
              animationKey={`${selectedMenu}-${selectedContact?._id || selectedActionLog?._id || 'list'}`}
              disabled={isTabRoot}
            >
              {selectedMenu === 'PROFILE' ? (
            <ProfileView user={session.user} />
          ) : null}
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
              onOpenActions={() => setSelectedMenu('ACTIONS')}
            />
          ) : null}

          {selectedMenu === 'CONTACTS' && selectedContact ? (
            <SlideInView animationKey={selectedContact._id}>
              <ContactDetailView
                contact={selectedContact}
                accessToken={session.accessToken}
                onBack={() => setSelectedContact(null)}
              />
            </SlideInView>
          ) : null}

          {selectedMenu === 'ACTIONS' && !selectedActionLog ? (
            <ActionLogsView
              loading={actionLogsLoading}
              items={actionLogs}
              onReload={loadActionLogs}
              onSelectAction={setSelectedActionLog}
            />
          ) : null}

          {selectedMenu === 'ACTIONS' && selectedActionLog ? (
                <ActionLogDetailView
                  item={selectedActionLog}
                  onBack={() => setSelectedActionLog(null)}
                  onSaveNote={saveActionLogNote}
                />
          ) : null}
            </SlideInView>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>

        <BottomTabs selectedMenu={selectedMenu} onSelect={onSelectMenu} />
      </View>
    </SafeAreaView>
  );
}

function titleForMenu(menu: MenuKey) {
  if (menu === 'HOME') return 'Ana Sayfa';
  if (menu === 'PROFILE') return 'Profilim';
  if (menu === 'CARD') return 'Kartvizitim';
  if (menu === 'BILLING') return 'Fatura Bilgileri';
  if (menu === 'CONTACTS') return 'Kişiler';
  if (menu === 'ACTIONS') return 'Aksiyonlarım';
  return 'Müşteriler';
}

function AppHeader({
  title,
  user,
  showBack,
  showSignOut,
  onBack,
  onSignOut
}: {
  title: string;
  user: AuthUser;
  showBack: boolean;
  showSignOut: boolean;
  onBack: () => void;
  onSignOut: () => void;
}) {
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toLocaleUpperCase('tr-TR') || 'U';

  return (
    <View style={styles.appHeader}>
      <View style={styles.headerTopRow}>
        {showBack ? (
          <Pressable style={styles.headerIconButton} onPress={onBack}>
            <Text style={styles.headerIconText}>‹</Text>
          </Pressable>
        ) : (
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{initials}</Text>
          </View>
        )}

        <View style={styles.headerTitleBlock}>
          <Text style={styles.headerKicker}>OneDesk</Text>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>

        {showSignOut ? (
          <Pressable style={styles.headerSignOutButton} onPress={onSignOut}>
            <Text style={styles.headerSignOutText}>Çıkış</Text>
          </Pressable>
        ) : (
          <View style={styles.headerRightSpacer} />
        )}
      </View>
    </View>
  );
}

function BottomTabs({
  selectedMenu,
  onSelect
}: {
  selectedMenu: MenuKey;
  onSelect: (menu: MenuKey) => void;
}) {
  const tabs: Array<{ key: MenuKey; label: string; short: string }> = [
    { key: 'HOME', label: 'Ana', short: 'A' },
    { key: 'PROFILE', label: 'Profil', short: 'P' },
    { key: 'CARD', label: 'Kart', short: 'K' },
    { key: 'CONTACTS', label: 'Kişiler', short: 'L' }
  ];

  return (
    <View style={styles.bottomTabs}>
      {tabs.map((tab) => {
        const active = selectedMenu === tab.key;
        return (
          <Pressable
            key={tab.key}
            style={[styles.bottomTabItem, active ? styles.bottomTabItemActive : null]}
            onPress={() => onSelect(tab.key)}
          >
            <View style={[styles.bottomTabIcon, active ? styles.bottomTabIconActive : null]}>
              <Text style={[styles.bottomTabIconText, active ? styles.bottomTabIconTextActive : null]}>{tab.short}</Text>
            </View>
            <Text style={[styles.bottomTabLabel, active ? styles.bottomTabLabelActive : null]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function HomeView({
  user,
  cardData,
  billingData,
  actionLogs,
  onNavigate
}: {
  user: AuthUser;
  cardData: PublicCardResponse | null;
  billingData: CompanyBillingResponse | null;
  actionLogs: ContactActionLogItem[];
  onNavigate: (menu: MenuKey) => void;
}) {
  const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
  const avatarUrl = user.businessCard?.avatarPublicUrl || user.businessCard?.avatarUrl || '';
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toLocaleUpperCase('tr-TR') || 'U';
  const latestAction = actionLogs[0];

  return (
    <>
      <View style={styles.heroCard}>
        <View style={styles.heroPattern} />
        <View style={styles.heroContent}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.heroAvatarImage} />
          ) : (
            <View style={styles.heroAvatar}>
              <Text style={styles.heroAvatarText}>{initials}</Text>
            </View>
          )}
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroEyebrow}>Hoş geldiniz</Text>
            <Text style={styles.heroName}>{displayName}</Text>
            <Text style={styles.heroSubtitle}>{user.title || user.department || billingData?.companyName || 'Ekip üyesi'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.quickGrid}>
        <QuickCard
          label="Kartvizitim"
          value={cardData?.businessCard?.displayName || displayName}
          accent="blue"
          onPress={() => onNavigate('CARD')}
        />
        <QuickCard
          label="Fatura"
          value={billingData?.billingInfo?.legalCompanyName || billingData?.companyName || 'Firma bilgileri'}
          accent="green"
          onPress={() => onNavigate('BILLING')}
        />
        <QuickCard
          label="Kişiler"
          value="Müşteri bağlantıları"
          accent="orange"
          onPress={() => onNavigate('CONTACTS')}
        />
        <QuickCard
          label="Müşteriler"
          value="Firma listesi"
          accent="slate"
          onPress={() => onNavigate('CUSTOMERS')}
        />
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Son Aksiyon</Text>
          <Pressable onPress={() => onNavigate('CONTACTS')}>
            <Text style={styles.refreshText}>Kişilerden Gör</Text>
          </Pressable>
        </View>
        {latestAction ? (
          <View style={styles.homeActionBlock}>
            <View style={styles.actionLogIcon}>
              <Text style={styles.actionLogIconText}>{actionInitial(latestAction.actionType)}</Text>
            </View>
            <View style={styles.actionLogTextBlock}>
              <Text style={styles.actionLogTitle}>{formatActionContact(latestAction)}</Text>
              <Text style={styles.actionLogSubtitle}>
                {translateContactAction(latestAction.actionType)} • {new Date(latestAction.occurredAt).toLocaleString('tr-TR')}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.emptyText}>Henüz aksiyon kaydı yok.</Text>
        )}
      </View>
    </>
  );
}

function QuickCard({
  label,
  value,
  accent,
  onPress
}: {
  label: string;
  value: string;
  accent: 'blue' | 'green' | 'orange' | 'slate';
  onPress: () => void;
}) {
  const accentStyle = {
    blue: styles.quickAccentBlue,
    green: styles.quickAccentGreen,
    orange: styles.quickAccentOrange,
    slate: styles.quickAccentSlate
  }[accent];

  return (
    <Pressable style={styles.quickCard} onPress={onPress}>
      <View style={[styles.quickAccent, accentStyle]} />
      <Text style={styles.quickLabel}>{label}</Text>
      <Text style={styles.quickValue} numberOfLines={2}>{value}</Text>
    </Pressable>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '-'}</Text>
    </View>
  );
}

function ProfileView({ user }: { user: AuthUser }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Öz Bilgiler</Text>
      <InfoRow label="Ad Soyad" value={`${user.firstName || ''} ${user.lastName || ''}`.trim()} />
      <InfoRow label="E-posta" value={user.workEmail || user.email} />
      <InfoRow label="Telefon" value={user.phone} />
      <InfoRow label="Departman" value={user.department} />
      <InfoRow label="Unvan" value={user.title} />
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
      <InfoRow label="Şirket" value={billingData.companyName} />
      <InfoRow label="Web sitesi" value={billingData.website} />
      <InfoRow label="Yasal isim" value={billingData.billingInfo?.legalCompanyName} />
      <InfoRow label="Vergi no" value={billingData.billingInfo?.taxNumber} />
      <InfoRow label="Vergi dairesi" value={billingData.billingInfo?.taxOffice} />
      <InfoRow label="Adres" value={billingData.billingInfo?.address} />
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
      <View style={styles.cardIdentityBlock}>
        <Text style={styles.cardName}>{cardData.businessCard.displayName || `${cardData.firstName} ${cardData.lastName}`}</Text>
        <Text style={styles.cardTitle}>{cardData.businessCard.title || cardData.businessCard.companyName || '-'}</Text>
      </View>
      <InfoRow label="E-posta" value={cardData.businessCard.email} />
      <InfoRow label="Telefon" value={cardData.businessCard.phone} />
      <InfoRow label="Şirket" value={cardData.businessCard.companyName} />
      {vCardText ? (
        <View style={styles.qrFrame}>
          <QRCode value={vCardText} size={224} />
        </View>
      ) : null}
    </View>
  );
}

function BillingView({
  loading,
  billingData,
  onReload
}: {
  loading: boolean;
  billingData: CompanyBillingResponse | null;
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
  onSelectContact,
  onOpenActions
}: {
  loading: boolean;
  contacts: ContactItem[];
  onReload: () => void;
  onSelectContact: (contact: ContactItem) => void;
  onOpenActions: () => void;
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
        <View style={styles.headerActionsRow}>
          <Pressable onPress={onOpenActions}>
            <Text style={styles.refreshText}>Aksiyonlar</Text>
          </Pressable>
          <Pressable onPress={onReload}>
            <Text style={styles.refreshText}>Yenile</Text>
          </Pressable>
        </View>
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

function SlideInView({
  children,
  animationKey,
  disabled = false
}: {
  children: ReactNode;
  animationKey: string;
  disabled?: boolean;
}) {
  const translateX = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (disabled) {
      translateX.setValue(0);
      opacity.setValue(1);
      return;
    }

    translateX.setValue(80);
    opacity.setValue(0);
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true
      })
    ]).start();
  }, [animationKey, disabled, opacity, translateX]);

  return <Animated.View style={{ opacity, transform: [{ translateX }] }}>{children}</Animated.View>;
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

function ActionLogsView({
  loading,
  items,
  onReload,
  onSelectAction
}: {
  loading: boolean;
  items: ContactActionLogItem[];
  onReload: () => void;
  onSelectAction: (item: ContactActionLogItem) => void;
}) {
  if (loading) {
    return <ActivityIndicator color="#2563eb" />;
  }

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Aksiyonlarım</Text>
        <Pressable onPress={onReload}>
          <Text style={styles.refreshText}>Yenile</Text>
        </Pressable>
      </View>

      {items.length === 0 ? <Text style={styles.infoLine}>Aksiyon kaydı yok.</Text> : null}

      {items.map((item) => (
        <Pressable key={item._id} style={styles.actionLogRow} onPress={() => onSelectAction(item)}>
          <View style={styles.actionLogIcon}>
            <Text style={styles.actionLogIconText}>{actionInitial(item.actionType)}</Text>
          </View>
          <View style={styles.actionLogTextBlock}>
            <Text style={styles.actionLogTitle}>{formatActionContact(item)}</Text>
            <Text style={styles.actionLogSubtitle}>
              {translateContactAction(item.actionType)} • {new Date(item.occurredAt).toLocaleString('tr-TR')}
            </Text>
            {item.note ? <Text style={styles.actionLogNote} numberOfLines={1}>{item.note}</Text> : null}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function ActionLogDetailView({
  item,
  onBack,
  onSaveNote
}: {
  item: ContactActionLogItem;
  onBack: () => void;
  onSaveNote: (id: string, note: string) => Promise<void>;
}) {
  const [note, setNote] = useState(item.note || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await onSaveNote(item._id, note);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.contactDetailCard}>
      <Pressable style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>‹ Aksiyonlarım</Text>
      </Pressable>

      <View style={styles.contactDetailHeader}>
        <View style={styles.actionDetailIcon}>
          <Text style={styles.actionDetailIconText}>{actionInitial(item.actionType)}</Text>
        </View>
        <Text style={styles.contactDetailName}>{translateContactAction(item.actionType)}</Text>
        <Text style={styles.contactDetailCompany}>{new Date(item.occurredAt).toLocaleString('tr-TR')}</Text>
      </View>

      <View style={styles.contactInfoList}>
        <Text style={styles.contactInfoLabel}>Kişi</Text>
        <Text style={styles.contactInfoValue}>{formatActionContact(item)}</Text>
        <Text style={styles.contactInfoLabel}>Firma</Text>
        <Text style={styles.contactInfoValue}>{item.customerId?.companyName || item.contactSnapshot?.companyName || '-'}</Text>
        <Text style={styles.contactInfoLabel}>Telefon</Text>
        <Text style={styles.contactInfoValue}>{item.contactId?.phone || item.contactSnapshot?.phone || '-'}</Text>
        <Text style={styles.contactInfoLabel}>E-posta</Text>
        <Text style={styles.contactInfoValue}>{item.contactId?.email || item.contactSnapshot?.email || '-'}</Text>
      </View>

      <View style={styles.noteBlock}>
        <Text style={styles.contactInfoLabel}>Not</Text>
        <TextInput
          style={[styles.input, styles.noteInput]}
          value={note}
          onChangeText={setNote}
          placeholder="Bu aksiyon için not yazın"
          multiline
        />
        <Pressable style={styles.primaryButton} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Notu Kaydet</Text>}
        </Pressable>
      </View>
    </View>
  );
}

function formatActionContact(item: ContactActionLogItem) {
  const fullName = `${item.contactId?.firstName || ''} ${item.contactId?.lastName || ''}`.trim();
  return fullName || item.contactSnapshot?.fullName || '-';
}

function translateContactAction(value: ContactActionType) {
  if (value === 'CALL') return 'Arama';
  if (value === 'WHATSAPP') return 'WhatsApp';
  return 'E-posta';
}

function actionInitial(value: ContactActionType) {
  if (value === 'CALL') return 'A';
  if (value === 'WHATSAPP') return 'W';
  return 'E';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef2f7',
    justifyContent: 'center',
    padding: 20
  },
  appContainer: {
    flex: 1,
    backgroundColor: '#eef2f7'
  },
  appShell: {
    flex: 1,
    backgroundColor: '#eef2f7'
  },
  appHeader: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: '#eef2f7'
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#14213d',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerAvatarText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dde5ef'
  },
  headerIconText: {
    color: '#0f172a',
    fontWeight: '800',
    fontSize: 30,
    lineHeight: 32
  },
  headerTitleBlock: {
    flex: 1
  },
  headerKicker: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase'
  },
  headerTitle: {
    color: '#0f172a',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5
  },
  headerSignOutButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dde5ef'
  },
  headerSignOutText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800'
  },
  headerRightSpacer: {
    width: 58,
    height: 38
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14
  },
  contentContainer: {
    paddingHorizontal: 18,
    paddingBottom: 104,
    gap: 14
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 22,
    gap: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    elevation: 4
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -1
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b'
  },
  input: {
    borderWidth: 1,
    borderColor: '#d7e0ea',
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 14,
    backgroundColor: '#fff',
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '600'
  },
  primaryButton: {
    backgroundColor: '#1d4ed8',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 3
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#d7e0ea',
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff'
  },
  secondaryButtonText: {
    color: '#0f172a',
    fontWeight: '800'
  },
  error: {
    color: '#b91c1c',
    fontSize: 14,
    fontWeight: '700'
  },
  hint: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600'
  },
  heroCard: {
    minHeight: 166,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#12213f',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 5
  },
  heroPattern: {
    position: 'absolute',
    right: -60,
    top: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#2f6fed',
    opacity: 0.52
  },
  heroContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-end',
    gap: 16
  },
  heroAvatar: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroAvatarImage: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: '#dbeafe'
  },
  heroAvatarText: {
    color: '#12213f',
    fontSize: 24,
    fontWeight: '900'
  },
  heroTextBlock: {
    gap: 3
  },
  heroEyebrow: {
    color: '#bfdbfe',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  heroName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.8
  },
  heroSubtitle: {
    color: '#dbeafe',
    fontSize: 15,
    fontWeight: '600'
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  quickCard: {
    width: '48%',
    minHeight: 108,
    borderRadius: 24,
    backgroundColor: '#fff',
    padding: 16,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  quickAccent: {
    width: 34,
    height: 5,
    borderRadius: 999
  },
  quickAccentBlue: {
    backgroundColor: '#2563eb'
  },
  quickAccentGreen: {
    backgroundColor: '#059669'
  },
  quickAccentOrange: {
    backgroundColor: '#f97316'
  },
  quickAccentSlate: {
    backgroundColor: '#334155'
  },
  quickLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase'
  },
  quickValue: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.4
  },
  cardIdentityBlock: {
    alignItems: 'center',
    paddingVertical: 10,
    gap: 4
  },
  cardName: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.8
  },
  cardTitle: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center'
  },
  qrFrame: {
    alignSelf: 'center',
    marginTop: 10,
    padding: 18,
    borderRadius: 26,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 3
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  refreshText: {
    fontSize: 13,
    color: '#1d4ed8',
    fontWeight: '900'
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600'
  },
  infoLine: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600'
  },
  infoRow: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 3
  },
  infoLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase'
  },
  infoValue: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700'
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14
  },
  profilePhoto: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: '#e2e8f0'
  },
  profilePhotoPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center'
  },
  profilePhotoInitials: {
    color: '#1d4ed8',
    fontSize: 24,
    fontWeight: '900'
  },
  billingBlock: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 18,
    padding: 14,
    gap: 6
  },
  billingLine: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600'
  },
  billingLegalName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.3
  },
  billingSectionTitle: {
    width: '100%',
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a'
  },
  customerItem: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 18,
    padding: 14,
    gap: 4
  },
  customerName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a'
  },
  contactsCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  contactGroup: {
    gap: 5
  },
  contactLetter: {
    paddingHorizontal: 7,
    paddingTop: 10,
    fontSize: 13,
    fontWeight: '900',
    color: '#1d4ed8'
  },
  contactGroupList: {
    borderTopWidth: 1,
    borderTopColor: '#eef2f7'
  },
  contactRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f7'
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center'
  },
  contactAvatarText: {
    color: '#1d4ed8',
    fontWeight: '900',
    fontSize: 15
  },
  contactTextBlock: {
    flex: 1
  },
  contactName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a'
  },
  contactCompany: {
    marginTop: 3,
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600'
  },
  contactDetailCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 18,
    gap: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 7,
    paddingHorizontal: 2
  },
  backButtonText: {
    fontSize: 16,
    color: '#1d4ed8',
    fontWeight: '900'
  },
  contactDetailHeader: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6
  },
  contactDetailAvatar: {
    width: 104,
    height: 104,
    borderRadius: 34,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center'
  },
  contactDetailAvatarText: {
    color: '#1d4ed8',
    fontWeight: '900',
    fontSize: 32
  },
  contactDetailName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
    letterSpacing: -0.7
  },
  contactDetailCompany: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '700'
  },
  contactActions: {
    flexDirection: 'row',
    gap: 10
  },
  contactActionButton: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: '#1d4ed8',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  disabledActionButton: {
    backgroundColor: '#cbd5e1'
  },
  contactActionText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 13
  },
  contactInfoList: {
    borderTopWidth: 1,
    borderTopColor: '#eef2f7',
    paddingTop: 12,
    gap: 5
  },
  contactInfoLabel: {
    marginTop: 9,
    fontSize: 11,
    fontWeight: '900',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.8
  },
  contactInfoValue: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '700'
  },
  homeActionBlock: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    padding: 12
  },
  actionLogRow: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#eef2f7',
    paddingVertical: 12
  },
  actionLogIcon: {
    width: 46,
    height: 46,
    borderRadius: 17,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionLogIconText: {
    color: '#1d4ed8',
    fontSize: 15,
    fontWeight: '900'
  },
  actionLogTextBlock: {
    flex: 1
  },
  actionLogTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a'
  },
  actionLogSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600'
  },
  actionLogNote: {
    marginTop: 5,
    fontSize: 13,
    color: '#334155',
    fontWeight: '600'
  },
  actionDetailIcon: {
    width: 92,
    height: 92,
    borderRadius: 30,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionDetailIconText: {
    color: '#1d4ed8',
    fontSize: 30,
    fontWeight: '900'
  },
  noteBlock: {
    gap: 10
  },
  noteInput: {
    minHeight: 120,
    textAlignVertical: 'top'
  },
  bottomTabs: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    minHeight: 72,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#dbe3ed',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius: 26,
    elevation: 8
  },
  bottomTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 20,
    paddingVertical: 6
  },
  bottomTabItemActive: {
    backgroundColor: '#eff6ff'
  },
  bottomTabIcon: {
    width: 26,
    height: 26,
    borderRadius: 10,
    backgroundColor: '#eef2f7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  bottomTabIconActive: {
    backgroundColor: '#1d4ed8'
  },
  bottomTabIconText: {
    color: '#64748b',
    fontWeight: '900',
    fontSize: 11
  },
  bottomTabIconTextActive: {
    color: '#fff'
  },
  bottomTabLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800'
  },
  bottomTabLabelActive: {
    color: '#1d4ed8'
  }
});
