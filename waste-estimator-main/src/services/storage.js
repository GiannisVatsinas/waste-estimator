const STORAGE_KEY = 'waste_vision_data';

// Helper to safely parse weights (handles "0,020" -> 0.02)
const safelyParseFloat = (val) => {
    if (!val) return 0;
    const strVal = val.toString().replace(',', '.');
    return parseFloat(strVal) || 0;
};

export const getScans = () => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
};

export const saveScan = (scanData) => {
    const scans = getScans();
    const newScan = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...scanData
    };

    // Calculate individual accuracy for this scan
    // accuracy = 100 - (|est - actual| / actual * 100)
    // If actual is 0 or Matches perfectly, handle cases
    const ai = safelyParseFloat(scanData.ai_weight);
    const actual = safelyParseFloat(scanData.weight); // 'weight' is now actual confirmed weight

    let accuracy = 0;
    if (actual > 0) {
        const errorMargin = Math.abs(ai - actual) / actual;
        accuracy = Math.max(0, (1 - errorMargin) * 100);
    } else if (ai === 0 && actual === 0) {
        accuracy = 100;
    }

    newScan.accuracy = parseFloat(accuracy.toFixed(1));

    const updatedScans = [newScan, ...scans];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedScans));
    return newScan;
};

// NEW FUNCTION: Delete a scan
export const deleteScan = (id) => {
    const currentData = getScans();
    const newData = currentData.filter(scan => scan.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    return newData;
};

// NEW FUNCTION: Bulk Delete
export const deleteScans = (ids) => {
    const currentData = getScans();
    // Filter out ANY scan whose ID is in the 'ids' array
    const newData = currentData.filter(scan => !ids.includes(scan.id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    return newData;
};

export const getStats = () => {
    const scans = getScans();

    const totalItems = scans.length;

    // 1. Basic Metrics
    let totalWeight = 0;
    let minWeight = totalItems > 0 ? safelyParseFloat(scans[0].weight) : 0;
    let maxWeight = 0;

    scans.forEach(scan => {
        const w = safelyParseFloat(scan.weight);
        totalWeight += w;
        if (w < minWeight) minWeight = w;
        if (w > maxWeight) maxWeight = w;
    });

    const averageWeight = totalItems > 0 ? (totalWeight / totalItems).toFixed(2) : "N/A";
    const formattedMin = totalItems > 0 ? minWeight.toFixed(2) : "N/A";
    const formattedMax = totalItems > 0 ? maxWeight.toFixed(2) : "N/A";

    // 2. Weight Distribution (Histogram)
    // Bins: 0-1, 1-5, 5-10, 10+
    const distribution = [
        { name: '0-1kg', count: 0 },
        { name: '1-5kg', count: 0 },
        { name: '5-10kg', count: 0 },
        { name: '10kg+', count: 0 }
    ];

    scans.forEach(scan => {
        const w = safelyParseFloat(scan.weight);
        if (w <= 1.0) distribution[0].count++;
        else if (w <= 5.0) distribution[1].count++;
        else if (w <= 10.0) distribution[2].count++;
        else distribution[3].count++;
    });

    // 3. Training Progress (Cumulative Samples over Time)
    // Sort by timestamp asc
    const sortedScans = [...scans].reverse(); // scans are stored newest first usually, so flip
    // Wait, getScans returns raw array. Check saveScan: "const updatedScans = [newScan, ...scans];" -> Newest first.
    // So yes, we reverse to get Oldest first.

    // Group by Date for cleaner chart? Or just raw cumulative?
    // Let's do raw cumulative step
    const trainingProgress = sortedScans.map((scan, index) => ({
        index: index + 1,
        date: new Date(scan.timestamp).toLocaleDateString(),
        samples: index + 1
    }));

    // If too many points, maybe sample them? For now keep all.

    // 4. Global Accuracy
    let validScans = 0;
    const totalAccuracy = scans.reduce((acc, curr) => {
        if (curr.accuracy !== undefined) {
            validScans++;
            return acc + curr.accuracy;
        }
        return acc;
    }, 0);

    const avgAccuracy = validScans > 0 ? (totalAccuracy / validScans).toFixed(1) : "N/A";

    return {
        totalItems,
        totalWeight: totalWeight.toFixed(2),
        averageWeight,
        minWeight: formattedMin,
        maxWeight: formattedMax,
        weightDistribution: distribution,
        trainingProgress,
        accuracy: avgAccuracy
    };
};
