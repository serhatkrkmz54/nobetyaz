import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface OnboardingTask {
  id: string;
  title: string;
  link: string;
  isComplete: boolean;
  details: {
    title: string;
    description: React.ReactNode;
  };
}

const TASKS_DATA: OnboardingTask[] = [
  {
    id: 'locations_done',
    title: '1. Adım: Çalışma Lokasyonları',
    link: '/management/locations',
    isComplete: false,
    details: {
      title: 'Adım 1: Lokasyonları Tanımlayın',
      description: (
        <div className="space-y-3">
          <p>Sistemin çalışması için ilk olarak nöbet tutulacak yerleri tanımlamanız gerekir.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Örnek: "Acil Servis", "Klinik 1", "Yoğun Bakım"</li>
            <li>Her lokasyonu "Aktif" veya "Pasif" olarak ayarlayabilirsiniz.</li>
          </ul>
          <p className="font-medium">Neden Gerekli? Boş nöbetleri oluştururken, sistem hangi lokasyonlara nöbet yazacağını buradan bilir.</p>
        </div>
      ),
    },
  },
  {
    id: 'qualifications_done',
    title: '2. Adım: Personel Yetkinlikleri',
    link: '/management/qualifications',
    isComplete: false,
    details: {
      title: 'Adım 2: Yetkinlikleri Belirleyin',
      description: (
        <div className="space-y-3">
          <p>Nöbetleri belirli personel gruplarına kısıtlamak için kullanılır.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Örnek: "Hemşire", "Stajyer", "Doktor", "Kıdemli Hemşire"</li>
          </ul>
          <p className="font-medium">Neden Gerekli? "Acil Servis Gece" nöbetini sadece "Hemşire" yetkinliğine sahip personelin alabilmesini sağlar.</p>
        </div>
      ),
    },
  },
  {
    id: 'templates_done',
    title: '3. Adım: Nöbet Şablonları',
    link: '/management/shift-templates',
    isComplete: false,
    details: {
      title: 'Adım 3: Nöbet Şablonları (Saatler)',
      description: (
        <div className="space-y-3">
          <p>Nöbetlerin saat aralıklarını ve tiplerini tanımlar.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Örnek 1: "Gündüz" (08:00 - 17:00)</li>
            <li>Örnek 2: "Gece" (17:00 - 09:00)</li>
          </ul>
          <p className="font-medium">Neden Gerekli? Çizelge oluşturulurken, hangi lokasyonda hangi saat aralığında nöbet olacağını belirler.</p>
        </div>
      ),
    },
  },
  {
    id: 'members_done',
    title: '4. Adım: Personelleri Ekleyin',
    link: '/management/members',
    isComplete: false,
    details: {
      title: 'Adım 4: Personelleri Sisteme Ekleyin',
      description: (
        <div className="space-y-3">
          <p>Nöbet tutacak tüm personellerinizi sisteme ekleyin.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Personele bir "Kullanıcı Adı" ve "E-posta" atayın.</li>
            <li>Oluşturduğunuz "Yetkinlikleri" (örn: Hemşire) personele atayın.</li>
            <li>Personel, "Hesap Aktivasyon" (PIN) ekranından hesabını aktifleştirecektir.</li>
          </ul>
          <p className="font-medium">Neden Gerekli? Yapay Zeka (AutoScheduler), nöbetleri bu listedeki personellere ve onların yetkinliklerine göre dağıtır.</p>
        </div>
      ),
    },
  },
  {
    id: 'schedule_done',
    title: '5. Adım: İlk Çizelgenizi Oluşturun',
    link: '/schedule',
    isComplete: false,
    details: {
      title: 'Adım 5: İlk Çizelgeyi Oluşturun',
      description: (
        <div className="space-y-3">
          <p>"Çizelge Yönetimi" sayfasında artık 2 adımlı sihirbazı kullanabilirsiniz:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li><b>1. Boş Nöbetleri Oluştur:</b> İlgili ay ve yıl için boş kadroları oluşturur.</li>
            <li><b>2. Otomatik Doldur:</b> Yapay zekayı başlatır. Boş nöbetleri, kurallara ve personel tercihlerine göre adil bir şekilde atar.</li>
          </ol>
          <p className="font-medium">İpucu: Takvimdeki nöbetlere tıklayarak manuel atama da yapabilirsiniz.</p>
        </div>
      ),
    },
  }
];

interface OnboardingState {
  tasks: OnboardingTask[];
  allTasksComplete: boolean;
  isCollapsed: boolean;
  toggleTask: (taskId: string) => void;
  hideGuide: () => void;
  toggleCollapsed: () => void;
}

// BU, localStorage'a KAYDEDİLECEK olan verinin yapısıdır.
// DİKKAT: Burada React.ReactNode (JSX) YOKTUR.
type PersistedState = {
  allTasksComplete: boolean;
  // Sadece 'id' ve 'isComplete' durumlarını kaydet
  taskStatuses: Array<{ id: string, isComplete: boolean }>;
}

export const useOnboardingStore = create(
  persist<OnboardingState, [], [], PersistedState>( 
    (set, get) => ({
      tasks: TASKS_DATA,
      allTasksComplete: false,
      isCollapsed: true,

      toggleTask: (taskId: string) => {
        set((state) => {
          const newTasks = state.tasks.map(task =>
            task.id === taskId ? { ...task, isComplete: !task.isComplete } : task
          );
          const allComplete = newTasks.every(task => task.isComplete);
          return { tasks: newTasks, allTasksComplete: allComplete };
        });
      },

      hideGuide: () => {
        set({ allTasksComplete: true });
      },

      toggleCollapsed: () => {
        set((state) => ({ isCollapsed: !state.isCollapsed }));
      }

    }),
    {
      name: 'nobetyaz-onboarding-store',
      storage: createJSONStorage(() => localStorage),

      // 1. ADIM: Kaydedilecek veriyi 'partialize' ile filtrele
      partialize: (state): PersistedState => ({
        allTasksComplete: state.allTasksComplete,
        // 'tasks' dizisinin tamamını (JSX ile) değil, 
        // sadece 'isComplete' durumlarını kaydet
        taskStatuses: state.tasks.map(task => ({
          id: task.id,
          isComplete: task.isComplete
        }))
      }),

      // 2. ADIM: Veri yüklenirken 'merge' ile state'i yeniden oluştur
      merge: (persistedState, currentState) => {
        // 'persistedState' localStorage'dan gelen (JSX olmayan) veridir
        // 'currentState' ise koddan gelen (TASKS_DATA) varsayılan veridir

        const p = persistedState as PersistedState;

        // Kayıtlı 'isComplete' durumlarını hızlı erişim için bir Map'e dönüştür
        const statusMap = new Map(
          p.taskStatuses?.map(item => [item.id, item.isComplete]) || []
        );

        // Orijinal 'TASKS_DATA' (currentState.tasks) üzerinden map yap
        // ve 'isComplete' durumlarını localStorage'dan gelen ile güncelle
        const mergedTasks = currentState.tasks.map(task => ({
          ...task, // 'details' (JSX) dahil tüm orijinal veriyi koru
          isComplete: statusMap.get(task.id) || task.isComplete // Kayıtlı durumu uygula
        }));

        return {
          ...currentState, // 'toggleTask', 'hideGuide' gibi fonksiyonları koru
          allTasksComplete: p.allTasksComplete, // Kayıtlı 'allTasksComplete' durumunu al
          tasks: mergedTasks, // Birleştirilmiş yeni 'tasks' dizisini state'e koy
        };
      }
    }
  )
);