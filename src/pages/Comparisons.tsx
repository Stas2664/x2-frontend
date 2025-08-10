import React, { useState, useEffect } from 'react';
import config from '../config';
import { AnimalEnergyData } from '../types';
import { calculateEnergyNeed } from '../utils/calculateEnergyNeed';
import { calculateIdealWeight } from '../utils/calculateIdealWeight';

interface Feed {
  id: number;
  name: string;
  brand: string;
  type: string;
  animal_type: string;
  crude_protein: number;
  crude_fat: number;
  crude_fiber: number;
  ash: number;
  moisture: number;
  metabolizable_energy: number;
  calcium: number;
  phosphorus: number;
  sodium: number;
  potassium: number;
  vitamins?: {
    vitamin_a?: number;
    vitamin_d3?: number;
    vitamin_e?: number;
    [key: string]: number | undefined;
  };
  feeding_guide: {
    [key: string]: string;
  };
}

interface AnimalData {
  weight: number;
  energyNeed: number;
  name: string;
}

const Comparisons: React.FC = () => {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [selectedFeeds, setSelectedFeeds] = useState<number[]>([]);
  const [animalData, setAnimalData] = useState<AnimalEnergyData>({
    species: 'собака',
    gender: 'самец',
    age: 3,
    condition: 5,
    name: 'Мой питомец',
    breed: '',
    status: 'кастрированный',
    activity: 'нормальная активность',
    owner: '',
    currentWeight: 15,
    targetWeight: 15,
    adultWeight: 15,
    lactationWeeks: 0,
    contact: '',
    meCoefficient: 1
  });
  const [energyNeed, setEnergyNeed] = useState<number>(calculateEnergyNeed(animalData));
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // --- СТЕЙТЫ ДЛЯ ФИЛЬТРОВ И ВЫБОРА ПОКАЗАТЕЛЕЙ ---
  const [filterAnimalType, setFilterAnimalType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPriceRange, setFilterPriceRange] = useState<'all' | 'budget' | 'premium' | 'ultra'>('all');
  const [compareFields, setCompareFields] = useState([
    'metabolizable_energy', 'moisture', 'crude_protein', 'crude_fat', 'crude_fiber', 'ash', 'calcium', 'phosphorus', 'vitamin_a', 'vitamin_d3'
  ]);
  const [compareMode, setCompareMode] = useState<'as_is' | 'per_1000kcal' | 'per_100g_dm'>('as_is');

  // --- НОВЫЕ СТЕЙТЫ ДЛЯ ДИАГНОЗА И НЕПЕРЕНОСИМОСТЕЙ ---
  const [diagnosis, setDiagnosis] = useState('');
  const [intolerances, setIntolerances] = useState('');
  
  // --- СТЕЙТ ДЛЯ ОТОБРАЖЕНИЯ ФОРМЫ ЖИВОТНОГО ---
  const [showAnimalForm, setShowAnimalForm] = useState(true);

  // Современные стили для полей
  const modernFieldStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 18px',
    fontSize: '15px',
    fontWeight: '500',
    color: '#2d3748',
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
    border: '2px solid rgba(0, 200, 81, 0.2)',
    borderRadius: '10px',
    outline: 'none',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 3px 15px rgba(0, 200, 81, 0.08)',
    fontFamily: 'inherit'
  };

  const modernSelectStyle: React.CSSProperties = {
    ...modernFieldStyle,
    paddingRight: '45px',
    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2300C851' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
    backgroundPosition: 'right 14px center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '18px',
    cursor: 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none'
  };

  const modernLabelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#2d3748',
    fontSize: '13px',
    letterSpacing: '0.5px'
  };

  const modernFocusStyle = {
    borderColor: '#00C851',
    boxShadow: '0 6px 25px rgba(0, 200, 81, 0.15), 0 0 0 3px rgba(0, 200, 81, 0.1)',
    transform: 'translateY(-1px)'
  };

  // --- НОРМАТИВЫ FEDIAF ---
  const getFediafNorm = (nutrient: string, animalSpecies: string, age: number) => {
    const isAdult = age >= 1;
    const species = animalSpecies.toLowerCase();
    
    const norms: { [key: string]: { [key: string]: { adult: string, puppy: string } } } = {
      'crude_protein': {
        'собака': { adult: '18%', puppy: '22.5%' },
        'кошка': { adult: '26%', puppy: '30%' },
      },
      'crude_fat': {
        'собака': { adult: '5.5%', puppy: '8.5%' },
        'кошка': { adult: '9%', puppy: '9%' },
      },
      'calcium': {
        'собака': { adult: '0.5%', puppy: '1.2%' },
        'кошка': { adult: '0.4%', puppy: '1.0%' },
      },
      'phosphorus': {
        'собака': { adult: '0.4%', puppy: '1.0%' },
        'кошка': { adult: '0.26%', puppy: '0.8%' },
      },
      'metabolizable_energy': {
        'собака': { adult: '3500-4200', puppy: '4000-4500' },
        'кошка': { adult: '4000-4500', puppy: '4200-4800' },
      },
      'crude_fiber': {
        'собака': { adult: '≤5%', puppy: '≤4%' },
        'кошка': { adult: '≤5%', puppy: '≤4%' },
      },
      'ash': {
        'собака': { adult: '≤8%', puppy: '≤8%' },
        'кошка': { adult: '≤8%', puppy: '≤8%' },
      }
    };

    if (norms[nutrient] && norms[nutrient][species]) {
      return isAdult ? norms[nutrient][species].adult : norms[nutrient][species].puppy;
    }
    return '-';
  };

  useEffect(() => {
    loadSelectedFeeds();
    loadAnimalDataFromCalculator();
    
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadAnimalDataFromCalculator = () => {
    try {
      const savedAnimalData = localStorage.getItem('animalData');
      if (savedAnimalData) {
        const animalFromCalculator = JSON.parse(savedAnimalData);
        
        // Устанавливаем данные из калькулятора
        setAnimalData(prev => ({
          ...prev,
          species: animalFromCalculator.species || prev.species,
          name: animalFromCalculator.name || prev.name,
          breed: animalFromCalculator.breed || prev.breed,
          age: animalFromCalculator.age || prev.age,
          gender: animalFromCalculator.gender || prev.gender,
          status: animalFromCalculator.status || prev.status,
          activity: animalFromCalculator.activity || prev.activity,
          condition: animalFromCalculator.condition || prev.condition,
          currentWeight: animalFromCalculator.currentWeight || prev.currentWeight,
          targetWeight: animalFromCalculator.targetWeight || prev.targetWeight,
          adultWeight: animalFromCalculator.adultWeight || prev.adultWeight,
          lactationWeeks: animalFromCalculator.lactationWeeks || prev.lactationWeeks,
          meCoefficient: animalFromCalculator.meCoefficient || prev.meCoefficient,
          owner: animalFromCalculator.owner || prev.owner,
          contact: animalFromCalculator.contact || prev.contact
        }));

        // Если есть diagnosis и intolerances в localStorage
        const savedDiagnosis = localStorage.getItem('diagnosis');
        const savedIntolerances = localStorage.getItem('intolerances');
        if (savedDiagnosis) setDiagnosis(savedDiagnosis);
        if (savedIntolerances) setIntolerances(savedIntolerances);
        
        console.log('Загружены данные животного из калькулятора');
      }
    } catch (error) {
      console.error('Ошибка загрузки данных животного:', error);
    }
  };

  // Автоматический расчет идеального веса при изменении current weight или condition
  useEffect(() => {
    if (animalData.currentWeight && animalData.currentWeight > 0 && 
        animalData.condition && animalData.condition >= 1 && animalData.condition <= 9) {
      const idealWeight = calculateIdealWeight(animalData.currentWeight, animalData.condition);
      if (idealWeight !== animalData.targetWeight) {
        setAnimalData(prev => ({
          ...prev,
          targetWeight: idealWeight
        }));
      }
    }
  }, [animalData.currentWeight, animalData.condition, animalData.targetWeight]);

  useEffect(() => {
    setEnergyNeed(calculateEnergyNeed(animalData));
  }, [animalData]);

  const loadSelectedFeeds = () => {
    try {
      // Загружаем выбранные корма из localStorage
      const savedFeeds = localStorage.getItem('selectedFeedsForComparison');
      const savedFeedIds = localStorage.getItem('selectedFeedIds');
      
      if (savedFeeds && savedFeedIds) {
        const feedsData = JSON.parse(savedFeeds);
        const feedIds = JSON.parse(savedFeedIds);
        
        setFeeds(feedsData);
        setSelectedFeeds(feedIds);
        
        console.log('Загружены выбранные корма:', feedsData.length);
      } else {
        // Если нет сохраненных данных, оставляем пустой массив
        setFeeds([]);
        setSelectedFeeds([]);
        console.log('Нет сохраненных кормов для сравнения');
      }
    } catch (error) {
      console.error('Ошибка загрузки выбранных кормов:', error);
      setFeeds([]);
      setSelectedFeeds([]);
    }
  };

  // --- ФИЛЬТРАЦИЯ КОРМОВ ---
  const filteredFeeds = feeds.filter(feed => {
    const matchesAnimal = !filterAnimalType || feed.animal_type === filterAnimalType;
    const matchesCategory = !filterCategory || feed.type === filterCategory; // Assuming 'type' is the category
    const matchesBrand = !filterBrand || feed.brand.toLowerCase().includes(filterBrand.toLowerCase());
    const matchesType = !filterType || feed.type === filterType;
    
    // Фильтр по ценовой категории (примерная логика на основе МЭ)
    let matchesPrice = true;
    if (filterPriceRange !== 'all') {
      const me = feed.metabolizable_energy;
      switch (filterPriceRange) {
        case 'budget':
          matchesPrice = me < 3500;
          break;
        case 'premium':
          matchesPrice = me >= 3500 && me < 4000;
          break;
        case 'ultra':
          matchesPrice = me >= 4000;
          break;
      }
    }
    
    return matchesAnimal && matchesCategory && matchesBrand && matchesType && matchesPrice;
  });

  // --- ВЫБОР КОРМОВ ---
  const handleFeedSelection = (feedId: number) => {
    if (selectedFeeds.includes(feedId)) {
      setSelectedFeeds(selectedFeeds.filter(id => id !== feedId));
    } else if (selectedFeeds.length < 5) {
      setSelectedFeeds([...selectedFeeds, feedId]);
    } else {
      alert('Можно сравнивать максимум 5 кормов одновременно');
    }
  };

  const getSelectedFeedsData = () => {
    return feeds.filter(feed => selectedFeeds.includes(feed.id));
  };

  const calculateDailyAmount = (feed: Feed) => {
    // МЭ в базе хранится в ккал/100г, поэтому умножаем на 100, а не на 1000
    const dailyAmountGrams = (energyNeed / feed.metabolizable_energy) * 100;
    const dailyAmountCups = dailyAmountGrams / 120; // 120г = 1 чашка
    
    return {
      grams: Math.round(dailyAmountGrams * 10) / 10,
      cups: Math.round(dailyAmountCups * 10) / 10,
      protein: Math.round((feed.crude_protein * dailyAmountGrams / 100) * 10) / 10,
      fat: Math.round((feed.crude_fat * dailyAmountGrams / 100) * 10) / 10,
      calcium: Math.round((feed.calcium * dailyAmountGrams / 100) * 10) / 10,
      phosphorus: Math.round((feed.phosphorus * dailyAmountGrams / 100) * 10) / 10,
      fiber: Math.round((feed.crude_fiber * dailyAmountGrams / 100) * 10) / 10,
      vitaminA: Math.round(((feed.vitamins?.vitamin_a || 0) * dailyAmountGrams / 1000) * 10) / 10,
      vitaminD3: Math.round(((feed.vitamins?.vitamin_d3 || 0) * dailyAmountGrams / 1000) * 10) / 10
    };
  };

  const getBestValue = (values: number[], isLower = false) => {
    return isLower ? Math.min(...values) : Math.max(...values);
  };

  const getValueColor = (value: number, bestValue: number, isLower = false) => {
    const isBest = isLower ? value === bestValue : value === bestValue;
    return isBest ? '#00C851' : '#666';
  };

  const getComparisonChart = (feeds: Feed[], property: keyof Feed, title: string) => {
    // Определяем цвета для каждого корма
    const colors = [
      'linear-gradient(135deg, #00C851 0%, #33B5E5 100%)',
      'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    ];
    
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '25px',
        border: '2px solid rgba(0, 200, 81, 0.1)',
        marginBottom: '20px',
        boxShadow: '0 8px 32px rgba(0, 200, 81, 0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <h3 style={{
          color: '#2d3748',
          marginBottom: '20px',
          fontSize: '1.3rem',
          fontWeight: '700',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #00C851 0%, #33B5E5 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {title}
        </h3>
        
        {feeds.map((feed, index) => {
          const value = Number(feed[property]);
          
          return (
            <div key={feed.id} style={{ marginBottom: '15px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '15px 20px',
                background: 'rgba(255, 255, 255, 0.8)',
                borderRadius: '12px',
                border: '2px solid rgba(0, 200, 81, 0.1)',
                boxShadow: '0 4px 15px rgba(0, 200, 81, 0.05)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    background: colors[index % colors.length]
                  }} />
                  <span style={{ 
                    fontSize: '16px', 
                    fontWeight: '600',
                    color: '#2d3748'
                  }}>
                    {feed.brand} {feed.name.substring(0, 30)}...
                  </span>
                </div>
                <div>
                  <span style={{ 
                    fontSize: '18px', 
                    fontWeight: '700',
                    color: '#2d3748'
                  }}>
                    {(() => {
                      if (property === 'metabolizable_energy') return `${value} ккал/кг`;
                      if (property === 'calcium') return `${(value * 1000).toFixed(0)} мг/100г`;
                      if (property === 'phosphorus') return `${(value * 10).toFixed(0)} мг/100г`;
                      if (['crude_protein', 'crude_fat', 'crude_fiber', 'ash'].includes(property as string)) return `${value} г`;
                      if ((property as string) === 'vitamin_a' || (property as string) === 'vitamin_d3') return `${value} МЕ/100г`;
                      return `${value}%`;
                    })()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const selectedFeedsData = getSelectedFeedsData();

  // --- ФУНКЦИИ ПЕРЕСЧЕТА ---
  const recalculateValue = (value: number, feed: any, nutrient: string) => {
  if (compareMode === 'as_is') {
    return value;
  }

  if (compareMode === 'per_1000kcal') {
    // Влажность в режиме 1000 ккал не меняем (по требованию клиента)
    if (nutrient === 'moisture') return value;

    // МЭ хранится как ккал/100 г
    const mePer100g =
      (feed as any).metabolizable_energy ??
      (feed as any).metabolic_energy ??
      (feed as any).kcal_per_100g ??
      (feed as any).kcalPer100g;

    if (!mePer100g || Number.isNaN(Number(mePer100g)) || Number(mePer100g) <= 0) {
      return value;
    }

    // Сколько граммов корма нужно для 1000 ккал (т.к. МЭ = ккал/100 г)
    const gramsFor1000 = 100000 / Number(mePer100g); // г

    // Показатели, приходящие в процентах (г/100г)
    const percentKeys = ['crude_protein','crude_fat','crude_fiber','ash','calcium','phosphorus'];
    if (percentKeys.includes(nutrient)) {
      const grams = (Number(value) / 100) * gramsFor1000;
      if (nutrient === 'calcium' || nutrient === 'phosphorus') {
        return grams * 1000; // мг/1000 ккал
      }
      return grams; // г/1000 ккал
    }

    // Для всех значений, которые трактуются как на 100 г (например, витамины после предварительного пересчёта в IU/100г)
    return Number(value) * (gramsFor1000 / 100);
  }

  if (compareMode === 'per_100g_dm') {
    // Пересчёт на 100 г сухого вещества: влажность = 0
    if (nutrient === 'moisture') return 0;
    const moisture = typeof feed.moisture === 'number' ? feed.moisture : 10;
    const dryMatter = 100 - moisture;
    if (dryMatter <= 0) return value;
    return (Number(value) * 100) / dryMatter;
  }

  return value;
};

export default Comparisons; 