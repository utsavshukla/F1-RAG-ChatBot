const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const embeddingService = require('./embeddingService');
const vectorService = require('./vectorService');

class DataService {
  constructor() {
    this.dataPath = path.join(__dirname, '../data');
    this.documents = [];
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    // Ensure data directory exists
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }

    this.initialized = true;
    console.log('✅ Data service initialized');
  }

  async checkDataExists() {
    try {
      const stats = await vectorService.getCollectionStats();
      return stats.totalDocuments > 0;
    } catch (error) {
      return false;
    }
  }

  async initializeData() {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log('🚀 Starting F1 data initialization...');

    try {
      // Step 1: Collect F1 data from various sources
      const f1Data = await this.collectF1Data();
      console.log(`📊 Collected ${f1Data.length} F1 documents`);

      // Step 2: Process and chunk the data
      const processedData = await this.processData(f1Data);
      console.log(`🔧 Processed ${processedData.length} data chunks`);

      // Step 3: Generate embeddings for all documents
      const documentsWithEmbeddings = await this.generateEmbeddings(processedData);
      console.log(`🧠 Generated embeddings for ${documentsWithEmbeddings.length} documents`);

      // Step 4: Store in vector database
      await vectorService.addDocuments(documentsWithEmbeddings);
      console.log('💾 Stored documents in vector database');

      // Step 5: Save metadata
      await this.saveMetadata(processedData);

      return {
        success: true,
        documentsProcessed: processedData.length,
        documentsStored: documentsWithEmbeddings.length,
        message: 'F1 data initialization completed successfully'
      };

    } catch (error) {
      console.error('❌ Data initialization failed:', error);
      throw new Error(`Data initialization failed: ${error.message}`);
    }
  }

  async collectF1Data() {
    const data = [];

    // 1. F1 Teams Information
    data.push(...await this.getF1TeamsData());

    // 2. F1 Drivers Information
    data.push(...await this.getF1DriversData());

    // 3. F1 Circuits Information
    data.push(...await this.getF1CircuitsData());

    // 4. F1 Regulations
    data.push(...await this.getF1RegulationsData());

    // 5. F1 History
    data.push(...await this.getF1HistoryData());

    // 6. Current Season Information
    data.push(...await this.getCurrentSeasonData());

    return data;
  }

  async getF1TeamsData() {
    const teams = [
      {
        title: 'Mercedes F1 Team',
        content: `Mercedes-AMG Petronas F1 Team is one of the most successful teams in Formula 1 history. Founded in 1954, the team has won multiple Constructors' Championships. The team is based in Brackley, UK, and uses Mercedes power units. Notable drivers include Lewis Hamilton, Nico Rosberg, and George Russell. The team's dominant era was from 2014-2021, winning 8 consecutive Constructors' Championships.`,
        type: 'team',
        source: 'f1_teams'
      },
      {
        title: 'Red Bull Racing',
        content: `Red Bull Racing is an Austrian Formula 1 team founded in 2005. The team has won multiple Constructors' and Drivers' Championships. Based in Milton Keynes, UK, Red Bull uses Honda power units. Notable drivers include Sebastian Vettel, Max Verstappen, and Daniel Ricciardo. The team has been particularly successful in the hybrid era with Max Verstappen winning multiple championships.`,
        type: 'team',
        source: 'f1_teams'
      },
      {
        title: 'Ferrari F1 Team',
        content: `Scuderia Ferrari is the oldest and most successful team in Formula 1, competing since 1950. The team is based in Maranello, Italy, and is the only team to have competed in every F1 season. Ferrari has won 16 Constructors' Championships and 15 Drivers' Championships. Notable drivers include Michael Schumacher, Niki Lauda, and Charles Leclerc. The team uses Ferrari power units.`,
        type: 'team',
        source: 'f1_teams'
      },
      {
        title: 'McLaren F1 Team',
        content: `McLaren Racing is a British Formula 1 team founded in 1963 by Bruce McLaren. The team has won 8 Constructors' Championships and 12 Drivers' Championships. Based in Woking, UK, McLaren currently uses Mercedes power units. Notable drivers include Ayrton Senna, Alain Prost, and Lando Norris. The team has a rich history in F1 and is known for its innovative approach.`,
        type: 'team',
        source: 'f1_teams'
      },
      {
        title: 'Aston Martin F1 Team',
        content: `Aston Martin F1 Team is a British Formula 1 team that entered the sport in 2021, taking over from Racing Point. The team is based in Silverstone, UK, and uses Mercedes power units. The team's current drivers include Fernando Alonso and Lance Stroll. Aston Martin has shown strong performance in recent seasons, particularly in 2023.`,
        type: 'team',
        source: 'f1_teams'
      }
    ];

    return teams;
  }

  async getF1DriversData() {
    const drivers = [
      {
        title: 'Max Verstappen',
        content: `Max Verstappen is a Dutch Formula 1 driver currently driving for Red Bull Racing. Born in 1997, he became the youngest F1 driver in history at age 17. Verstappen has won multiple World Championships and is known for his aggressive driving style and exceptional talent. He has broken numerous records and is considered one of the most talented drivers in F1 history.`,
        type: 'driver',
        source: 'f1_drivers'
      },
      {
        title: 'Lewis Hamilton',
        content: `Lewis Hamilton is a British Formula 1 driver currently driving for Mercedes. Born in 1985, he is a 7-time World Champion, tied with Michael Schumacher for the most championships. Hamilton is known for his consistency, speed, and activism for diversity in motorsport. He has won over 100 Grand Prix races and holds numerous F1 records.`,
        type: 'driver',
        source: 'f1_drivers'
      },
      {
        title: 'Charles Leclerc',
        content: `Charles Leclerc is a Monegasque Formula 1 driver currently driving for Ferrari. Born in 1997, he is known for his exceptional qualifying pace and aggressive driving style. Leclerc has won multiple Grand Prix races and is considered one of the most talented young drivers in F1. He has been with Ferrari since 2019.`,
        type: 'driver',
        source: 'f1_drivers'
      },
      {
        title: 'Lando Norris',
        content: `Lando Norris is a British Formula 1 driver currently driving for McLaren. Born in 1999, he is one of the youngest drivers on the grid and is known for his consistency and technical feedback. Norris has achieved multiple podium finishes and is considered a future world champion contender.`,
        type: 'driver',
        source: 'f1_drivers'
      },
      {
        title: 'Fernando Alonso',
        content: `Fernando Alonso is a Spanish Formula 1 driver currently driving for Aston Martin. Born in 1981, he is a 2-time World Champion and one of the most experienced drivers in F1. Alonso is known for his exceptional racecraft and ability to extract maximum performance from any car. He has won 32 Grand Prix races.`,
        type: 'driver',
        source: 'f1_drivers'
      }
    ];

    return drivers;
  }

  async getF1CircuitsData() {
    const circuits = [
      {
        title: 'Monaco Grand Prix',
        content: `The Monaco Grand Prix is one of the most prestigious races in Formula 1, held on the Circuit de Monaco in Monte Carlo. The circuit is known for its tight, twisty layout and lack of overtaking opportunities. It's considered the ultimate test of driver skill and car handling. The race has been part of F1 since 1950 and is often called the "Crown Jewel" of Formula 1.`,
        type: 'circuit',
        source: 'f1_circuits'
      },
      {
        title: 'Silverstone Circuit',
        content: `Silverstone Circuit is the home of the British Grand Prix and is located in Northamptonshire, England. The circuit is known for its high-speed corners and challenging layout. It hosted the first Formula 1 World Championship race in 1950. Silverstone is a favorite among drivers and fans for its fast, flowing nature and rich history.`,
        type: 'circuit',
        source: 'f1_circuits'
      },
      {
        title: 'Monza Circuit',
        content: `The Monza Circuit, located in Italy, is known as the "Temple of Speed" due to its high-speed nature. It's the fastest circuit on the F1 calendar and features long straights and challenging chicanes. Monza has hosted the Italian Grand Prix since 1950 and is one of the most historic circuits in Formula 1.`,
        type: 'circuit',
        source: 'f1_circuits'
      },
      {
        title: 'Spa-Francorchamps',
        content: `The Circuit de Spa-Francorchamps in Belgium is considered one of the greatest racing circuits in the world. Known for its challenging corners like Eau Rouge and unpredictable weather, Spa is a favorite among drivers and fans. The circuit is famous for its elevation changes and technical complexity.`,
        type: 'circuit',
        source: 'f1_circuits'
      },
      {
        title: 'Suzuka Circuit',
        content: `The Suzuka Circuit in Japan is known for its figure-eight layout and challenging corners. It's considered one of the most technical circuits in Formula 1 and is a favorite among drivers. Suzuka has hosted the Japanese Grand Prix since 1987 and is known for its unique design and demanding nature.`,
        type: 'circuit',
        source: 'f1_circuits'
      }
    ];

    return circuits;
  }

  async getF1RegulationsData() {
    const regulations = [
      {
        title: 'F1 Technical Regulations',
        content: `Formula 1 technical regulations govern the design and construction of F1 cars. These include aerodynamic restrictions, engine specifications, fuel regulations, and safety requirements. The regulations are constantly evolving to improve safety, reduce costs, and promote closer racing. Current regulations focus on ground effect aerodynamics and sustainable fuels.`,
        type: 'regulation',
        source: 'f1_regulations'
      },
      {
        title: 'F1 Sporting Regulations',
        content: `F1 sporting regulations cover race procedures, qualifying formats, points systems, and driver conduct. These include rules about overtaking, pit stops, safety car procedures, and penalties. The regulations ensure fair competition and safety for all participants.`,
        type: 'regulation',
        source: 'f1_regulations'
      },
      {
        title: 'F1 Safety Regulations',
        content: `F1 safety regulations are among the most comprehensive in motorsport. They include crash testing requirements, driver safety equipment, circuit safety standards, and medical protocols. These regulations have evolved significantly over the years, making F1 one of the safest forms of motorsport.`,
        type: 'regulation',
        source: 'f1_regulations'
      },
      {
        title: 'F1 Financial Regulations',
        content: `F1 financial regulations, including the cost cap, limit team spending to promote fair competition. The cost cap restricts annual spending to $135 million per team, excluding driver salaries and marketing costs. These regulations aim to level the playing field and ensure the sport's long-term sustainability.`,
        type: 'regulation',
        source: 'f1_regulations'
      }
    ];

    return regulations;
  }

  async getF1HistoryData() {
    const history = [
      {
        title: 'F1 World Championship History',
        content: `The Formula 1 World Championship was established in 1950 and has been the pinnacle of motorsport ever since. The championship has evolved significantly over the decades, with changes in technology, regulations, and team structures. Notable eras include the turbo era of the 1980s, the V10 era of the 1990s and 2000s, and the current hybrid era.`,
        type: 'history',
        source: 'f1_history'
      },
      {
        title: 'F1 Legendary Drivers',
        content: `Formula 1 has produced many legendary drivers including Juan Manuel Fangio, Ayrton Senna, Michael Schumacher, and Lewis Hamilton. These drivers have set records, won multiple championships, and left lasting legacies in the sport. Each era has produced its own legends who have pushed the boundaries of what's possible in motorsport.`,
        type: 'history',
        source: 'f1_history'
      },
      {
        title: 'F1 Technological Evolution',
        content: `Formula 1 has been at the forefront of automotive technology since its inception. The sport has pioneered innovations in aerodynamics, engine technology, materials science, and electronics. Many technologies developed in F1 have found their way into road cars, making the sport a crucial testing ground for automotive advancement.`,
        type: 'history',
        source: 'f1_history'
      },
      {
        title: 'F1 Safety Evolution',
        content: `F1 safety has evolved dramatically since the 1950s. From basic helmets and minimal protection, the sport now features comprehensive safety systems including the Halo device, advanced crash structures, and sophisticated medical protocols. This evolution has saved countless lives and made F1 one of the safest forms of motorsport.`,
        type: 'history',
        source: 'f1_history'
      }
    ];

    return history;
  }

  async getCurrentSeasonData() {
    const currentSeason = [
      {
        title: '2024 F1 Season',
        content: `The 2024 Formula 1 season features 24 races across the globe. The season includes traditional circuits and new venues, with teams competing under the current technical regulations. The season is expected to be highly competitive with multiple teams capable of winning races.`,
        type: 'season',
        source: 'f1_current'
      },
      {
        title: 'F1 Sprint Races',
        content: `F1 Sprint races are shorter format races held on Saturdays at selected Grand Prix weekends. These races provide additional entertainment and opportunities for drivers to score points. Sprint races have been well-received by fans and add an extra dimension to race weekends.`,
        type: 'season',
        source: 'f1_current'
      },
      {
        title: 'F1 Sustainability Initiatives',
        content: `Formula 1 has committed to becoming carbon neutral by 2030. The sport is implementing sustainable fuels, reducing waste, and promoting environmental awareness. These initiatives are crucial for the sport's long-term future and align with global environmental goals.`,
        type: 'season',
        source: 'f1_current'
      }
    ];

    return currentSeason;
  }

  async processData(rawData) {
    const processedData = [];

    for (const item of rawData) {
      // Split long content into smaller chunks
      const chunks = this.chunkText(item.content, 500);
      
      chunks.forEach((chunk, index) => {
        processedData.push({
          id: `${item.type}_${item.title.replace(/\s+/g, '_')}_${index}`,
          title: item.title,
          content: chunk,
          type: item.type,
          source: item.source,
          timestamp: new Date().toISOString(),
          metadata: {
            title: item.title,
            type: item.type,
            source: item.source,
            chunkIndex: index,
            totalChunks: chunks.length
          }
        });
      });
    }

    return processedData;
  }

  chunkText(text, maxLength) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (currentChunk.length + trimmedSentence.length + 1 <= maxLength) {
        currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk + '.');
        }
        currentChunk = trimmedSentence;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk + '.');
    }

    return chunks.length > 0 ? chunks : [text];
  }

  async generateEmbeddings(documents) {
    const documentsWithEmbeddings = [];

    for (const doc of documents) {
      try {
        const embedding = await embeddingService.embedText(doc.content);
        documentsWithEmbeddings.push({
          ...doc,
          embedding
        });
      } catch (error) {
        console.error(`❌ Failed to generate embedding for document: ${doc.id}`);
        // Continue with other documents
      }
    }

    return documentsWithEmbeddings;
  }

  async saveMetadata(data) {
    const metadata = {
      totalDocuments: data.length,
      types: [...new Set(data.map(d => d.type))],
      sources: [...new Set(data.map(d => d.source))],
      timestamp: new Date().toISOString()
    };

    const metadataPath = path.join(this.dataPath, 'metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  }

  async getAvailableTopics() {
    return [
      { id: 'teams', name: 'F1 Teams', description: 'Information about current and historical F1 teams' },
      { id: 'drivers', name: 'F1 Drivers', description: 'Profiles and statistics of F1 drivers' },
      { id: 'circuits', name: 'F1 Circuits', description: 'Information about F1 racing circuits' },
      { id: 'regulations', name: 'F1 Regulations', description: 'Technical and sporting regulations' },
      { id: 'history', name: 'F1 History', description: 'Historical information about Formula 1' },
      { id: 'current', name: 'Current Season', description: 'Information about the current F1 season' }
    ];
  }
}

module.exports = new DataService();
