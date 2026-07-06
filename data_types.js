class Overload {
    constructor(properties = {}) {
        this.data = []; // Array of {time, current} objects
        this.mfg = properties.mfg || '';
        this.mpn = properties.mpn || '';
        this.type = properties.type || '';
        this.voltage = properties.voltage || '';
        this.rating = properties.rating || '';
    }

    // Add a new overload data point; band marks a min/max envelope edge ('' = single curve)
    addDataPoint(time, current, band = '') {
        if (time === undefined || current === undefined) {
            throw new Error('Both time and current must be provided');
        }
        this.data.push({ time, current, band });
    }

    // True when the device carries a min/max envelope (both edges present)
    hasBand() {
        return this.data.some(p => p.band === 'min') && this.data.some(p => p.band === 'max');
    }

    // Get all overload data
    getData() {
        return [...this.data];
    }

    // Get data sorted by time, optionally filtered to one envelope edge ('min'/'max')
    getSortedData(band) {
        const points = band === undefined ? this.data : this.data.filter(p => p.band === band);
        return [...points].sort((a, b) => a.time - b.time);
    }

    // Get the maximum current value
    getMaxCurrent() {
        if (this.data.length === 0) return null;
        return Math.max(...this.data.map(point => point.current));
    }

    // Get the data point with the highest current
    getPeakOverload() {
        if (this.data.length === 0) return null;
        return this.data.reduce((max, point) => 
            point.current > max.current ? point : max
        );
    }

    // Filter data by time range
    filterByTimeRange(startTime, endTime) {
        return this.data.filter(
            point => point.time >= startTime && point.time <= endTime 
        );
    }

    // Calculate average current
    getAverageCurrent() {
        if (this.data.length === 0) return null;
        const sum = this.data.reduce((acc, point) => acc + point.current, 0);
        return sum / this.data.length;
    }

    // Clear all data
    clear() {
        this.data = [];
    }

    // Get label for sidebar and chart legend (name plus rating/voltage when present)
    getLabel() {
        const name = `${this.mfg} ${this.mpn}`.trim();
        // Append the unit only when the sheet value is a bare number (e.g. "20" vs "20A")
        const fmt = (value, unit) => {
            const v = String(value || '').trim();
            if (!v) return '';
            return /^[0-9.]+$/.test(v) ? `${v} ${unit}` : v;
        };
        const specs = [fmt(this.rating, 'A'), fmt(this.voltage, 'V')].filter(Boolean).join(' / ');
        return specs ? `${name} — ${specs}` : name;
    }

    // Get all properties
    getProperties() {
        return {
            mfg: this.mfg,
            mpn: this.mpn,
            type: this.type,
            voltage: this.voltage,
            rating: this.rating
        };
    }

    // Load data from URL and create multiple Overload objects based on unique properties
    static async loadFromUrl(url) {
        try {
            // no-store: always fetch fresh sheet data instead of a browser-cached copy
            const response = await fetch(url, { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvText = await response.text();
            
            const lines = csvText.split('\n');
            const headers = lines[0].toLowerCase().split(',');
            
            // Find column indices
            const timeIndex = headers.findIndex(h => h.includes('time'));
            const currentIndex = headers.findIndex(h => h.includes('current'));
            const mfgIndex = headers.findIndex(h => h.includes('mfg'));
            const mpnIndex = headers.findIndex(h => h.includes('mpn'));
            const typeIndex = headers.findIndex(h => h.includes('type'));
            const voltageIndex = headers.findIndex(h => h.includes('voltage'));
            const ratingIndex = headers.findIndex(h => h.includes('rating'));
            const bandIndex = headers.findIndex(h => h.includes('band'));
            
            if (timeIndex === -1 || currentIndex === -1) {
                throw new Error('CSV must contain time and current columns');
            }

            // Group data by unique property combinations
            const overloadGroups = new Map();

            // Process each data row
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line) {
                    const values = line.split(',');
                    
                    // Extract properties
                    const properties = {
                        mfg: mfgIndex !== -1 ? values[mfgIndex] : '',
                        mpn: mpnIndex !== -1 ? values[mpnIndex] : '',
                        type: typeIndex !== -1 ? values[typeIndex] : '',
                        voltage: voltageIndex !== -1 ? values[voltageIndex] : '',
                        rating: ratingIndex !== -1 ? values[ratingIndex] : ''
                    };
                    
                    // Create unique key from mfg and mpn
                    const key = `${properties.mfg}-${properties.mpn}`;
                    
                    // Get or create Overload instance for this property combination
                    if (!overloadGroups.has(key)) {
                        overloadGroups.set(key, new Overload(properties));
                    }
                    
                    // Add data point to appropriate Overload instance
                    const time = parseFloat(values[timeIndex]);
                    const current = parseFloat(values[currentIndex]);
                    const band = bandIndex !== -1 ? (values[bandIndex] || '').trim().toLowerCase() : '';

                    if (!isNaN(time) && !isNaN(current)) {
                        overloadGroups.get(key).addDataPoint(time, current, band);
                    }
                }
            }
            
            // Convert Map to array of Overload objects
            return Array.from(overloadGroups.values());
            
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }
}
