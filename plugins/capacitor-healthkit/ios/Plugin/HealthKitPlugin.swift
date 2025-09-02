import Foundation
import Capacitor
import HealthKit

@objc(HealthKitPlugin)
public class HealthKitPlugin: CAPPlugin {
    private let healthStore = HKHealthStore()
    private var observers: [String: HKObserverQuery] = [:]
    private let cache = NSCache<NSString, NSArray>()
    private let cacheExpirationTime: TimeInterval = 300 // 5 minute cache
    private var lastQueryTimes: [String: Date] = [:]
    private var backgroundDeliveryEnabled = false
    
    // MARK: - Background Delivery
    
    private func enableBackgroundDelivery(for type: HKQuantityType) {
        guard !backgroundDeliveryEnabled else { return }
        
        healthStore.enableBackgroundDelivery(for: type, frequency: .immediate) { (success, error) in
            if let error = error {
                print("Error enabling background delivery: \(error.localizedDescription)")
            } else if success {
                self.backgroundDeliveryEnabled = true
                print("Background delivery enabled for \(type.identifier)")
            }
        }
    }
    
    // MARK: - Data Validation
    
    private func validateHealthData(_ sample: HKQuantitySample, for dataType: String) -> Bool {
        // Basic validation
        guard sample.startDate <= sample.endDate else { return false }
        
        // Type-specific validation
        switch dataType {
        case "heartRate":
            let value = sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: HKUnit.minute()))
            return value >= 30 && value <= 250 // Reasonable heart rate range
            
        case "steps":
            let value = sample.quantity.doubleValue(for: HKUnit.count())
            return value >= 0 && value <= 100000 // Reasonable step count range
            
        case "weight":
            let value = sample.quantity.doubleValue(for: HKUnit.gramUnit(with: .kilo))
            return value >= 20 && value <= 300 // Reasonable weight range in kg
            
        case "vo2max":
            let value = sample.quantity.doubleValue(for: HKUnit.literUnit(with: .milli).unitDivided(by: HKUnit.gramUnit(with: .kilo).unitMultiplied(by: HKUnit.minute())))
            return value >= 10 && value <= 100 // Reasonable VO2max range
            
        case "calories":
            let value = sample.quantity.doubleValue(for: HKUnit.kilocalorie())
            return value >= 0 && value <= 10000 // Reasonable calorie range
            
        case "distance":
            let value = sample.quantity.doubleValue(for: HKUnit.meter())
            return value >= 0 && value <= 100000 // Reasonable distance range
            
        case "restingHeartRate":
            let value = sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: HKUnit.minute()))
            return value >= 30 && value <= 120 // Reasonable resting heart rate range
            
        case "heartRateVariability":
            let value = sample.quantity.doubleValue(for: HKUnit.secondUnit(with: .milli))
            return value >= 0 && value <= 200 // Reasonable HRV range
            
        default:
            return true // No specific validation for other types
        }
    }
    
    // MARK: - Query Methods
    
    @objc func isAvailable(_ call: CAPPluginCall) {
        call.resolve([
            "available": HKHealthStore.isHealthDataAvailable()
        ])
    }
    
    @objc func requestAuthorization(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.reject("HealthKit is not available on this device")
            return
        }
        
        // Define the health data types we want to read
        var typesToRead: Set<HKObjectType> = [
            // Core metrics
            HKObjectType.quantityType(forIdentifier: .heartRate)!,
            HKObjectType.quantityType(forIdentifier: .stepCount)!,
            HKObjectType.quantityType(forIdentifier: .bodyMass)!,
            HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!,
            HKObjectType.quantityType(forIdentifier: .vo2Max)!,
            
            // Additional existing types
            HKObjectType.quantityType(forIdentifier: .activeEnergyBurned)!,
            HKObjectType.quantityType(forIdentifier: .distanceWalkingRunning)!,
            HKObjectType.quantityType(forIdentifier: .restingHeartRate)!,
            HKObjectType.quantityType(forIdentifier: .heartRateVariabilitySDNN)!,
            HKObjectType.workoutType(),
            
            // Additional cardiovascular metrics
            HKObjectType.quantityType(forIdentifier: .oxygenSaturation)!,
            HKObjectType.quantityType(forIdentifier: .respiratoryRate)!,
            HKObjectType.quantityType(forIdentifier: .bodyTemperature)!,
            
            // Energy & nutrition metrics
            HKObjectType.quantityType(forIdentifier: .basalEnergyBurned)!,
            HKObjectType.quantityType(forIdentifier: .dietaryEnergyConsumed)!,
            HKObjectType.quantityType(forIdentifier: .dietaryProtein)!,
            HKObjectType.quantityType(forIdentifier: .dietaryCarbohydrates)!,
            HKObjectType.quantityType(forIdentifier: .dietaryFatTotal)!,
            HKObjectType.quantityType(forIdentifier: .dietaryWater)!,
            
            // Detailed nutritional data
            HKObjectType.quantityType(forIdentifier: .dietaryFiber)!,
            HKObjectType.quantityType(forIdentifier: .dietarySugar)!,
            HKObjectType.quantityType(forIdentifier: .dietaryFatSaturated)!,
            HKObjectType.quantityType(forIdentifier: .dietaryFatMonounsaturated)!,
            HKObjectType.quantityType(forIdentifier: .dietaryFatPolyunsaturated)!,
            HKObjectType.quantityType(forIdentifier: .dietaryCholesterol)!,
            HKObjectType.quantityType(forIdentifier: .dietarySodium)!,
            
            // Micronutrients (vitamins & minerals)
            HKObjectType.quantityType(forIdentifier: .dietaryCalcium)!,
            HKObjectType.quantityType(forIdentifier: .dietaryIron)!,
            HKObjectType.quantityType(forIdentifier: .dietaryPotassium)!,
            HKObjectType.quantityType(forIdentifier: .dietaryVitaminA)!,
            HKObjectType.quantityType(forIdentifier: .dietaryVitaminC)!,
            HKObjectType.quantityType(forIdentifier: .dietaryVitaminD)!,
            
            // Activity and movement metrics
            HKObjectType.quantityType(forIdentifier: .appleExerciseTime)!,
            HKObjectType.quantityType(forIdentifier: .appleStandTime)!,
            HKObjectType.quantityType(forIdentifier: .walkingSpeed)!
        ]
        
        // Additional category types
        typesToRead.insert(HKObjectType.categoryType(forIdentifier: .mindfulSession)!)
        
        // Add iOS 17+ specific types
        if #available(iOS 17.0, *) {
            // Some metrics are only available on iOS 17+
            // We need to check individually to avoid compile errors
            if let timeInDaylight = HKObjectType.quantityType(forIdentifier: .timeInDaylight) {
                typesToRead.insert(timeInDaylight)
            }
        }
        
        // Add iOS 16+ specific types
        if #available(iOS 16.0, *) {
            if let runningSpeed = HKObjectType.quantityType(forIdentifier: .runningSpeed) {
                typesToRead.insert(runningSpeed)
            }
            
            if let runningPower = HKObjectType.quantityType(forIdentifier: .runningPower) {
                typesToRead.insert(runningPower)
            }
            
            if let sixMinuteWalkTestDistance = HKObjectType.quantityType(forIdentifier: .sixMinuteWalkTestDistance) {
                typesToRead.insert(sixMinuteWalkTestDistance)
            }
            
            if let stairAscentSpeed = HKObjectType.quantityType(forIdentifier: .stairAscentSpeed) {
                typesToRead.insert(stairAscentSpeed)
            }
            
            if let stairDescentSpeed = HKObjectType.quantityType(forIdentifier: .stairDescentSpeed) {
                typesToRead.insert(stairDescentSpeed)
            }
        }
        
        // Request authorization
        healthStore.requestAuthorization(toShare: nil, read: typesToRead) { (success, error) in
            if success {
                call.resolve(["authorized": true])
            } else {
                call.reject("Failed to authorize HealthKit: \(error?.localizedDescription ?? "Unknown error")")
            }
        }
    }
    
    @objc func queryHealthData(_ call: CAPPluginCall) {
        let dataType = call.getString("dataType") ?? ""
        let period = call.getString("period") ?? "day"
        let forceRefresh = call.getBool("forceRefresh") ?? false
        
        // Check cache if force refresh isn't requested
        if !forceRefresh {
            let cacheKey = "\(dataType)_\(period)" as NSString
            if let cachedResults = cache.object(forKey: cacheKey) as? [[String: Any]],
               let lastQueryTime = lastQueryTimes[dataType],
               Date().timeIntervalSince(lastQueryTime) < cacheExpirationTime {
                call.resolve(["data": cachedResults])
                return
            }
        }
        
        // Determine the quantity type based on the data type
        var quantityType: HKQuantityType?
        
        switch dataType {
        // Core metrics
        case "heartRate":
            quantityType = HKQuantityType.quantityType(forIdentifier: .heartRate)
        case "steps":
            quantityType = HKQuantityType.quantityType(forIdentifier: .stepCount)
        case "weight":
            quantityType = HKQuantityType.quantityType(forIdentifier: .bodyMass)
        case "vo2max":
            quantityType = HKQuantityType.quantityType(forIdentifier: .vo2Max)
        case "calories":
            quantityType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned)
        case "distance":
            quantityType = HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning)
        case "restingHeartRate":
            quantityType = HKQuantityType.quantityType(forIdentifier: .restingHeartRate)
        case "heartRateVariability":
            quantityType = HKQuantityType.quantityType(forIdentifier: .heartRateVariabilitySDNN)
            
        // Cardiovascular & Respiratory metrics
        case "oxygenSaturation":
            quantityType = HKQuantityType.quantityType(forIdentifier: .oxygenSaturation)
        case "respiratoryRate":
            quantityType = HKQuantityType.quantityType(forIdentifier: .respiratoryRate)
        case "bodyTemperature":
            quantityType = HKQuantityType.quantityType(forIdentifier: .bodyTemperature)
            
        // Energy & basic nutrition metrics
        case "basalEnergy":
            quantityType = HKQuantityType.quantityType(forIdentifier: .basalEnergyBurned)
        case "dietaryEnergy":
            quantityType = HKQuantityType.quantityType(forIdentifier: .dietaryEnergyConsumed)
        case "dietaryProtein":
            quantityType = HKQuantityType.quantityType(forIdentifier: .dietaryProtein)
        case "dietaryCarbs":
            quantityType = HKQuantityType.quantityType(forIdentifier: .dietaryCarbohydrates)
        case "dietaryFat":
            quantityType = HKQuantityType.quantityType(forIdentifier: .dietaryFatTotal)
        case "dietaryWater":
            quantityType = HKQuantityType.quantityType(forIdentifier: .dietaryWater)
            
        // Detailed nutritional data
        case "dietaryFiber":
            quantityType = HKQuantityType.quantityType(forIdentifier: .dietaryFiber)
        case "dietarySugar":
            quantityType = HKQuantityType.quantityType(forIdentifier: .dietarySugar)
        case "dietarySodium":
            quantityType = HKQuantityType.quantityType(forIdentifier: .dietarySodium)
        case "dietaryCholesterol":
            quantityType = HKQuantityType.quantityType(forIdentifier: .dietaryCholesterol)
            
        // Micronutrients
        case "dietaryCalcium":
            quantityType = HKQuantityType.quantityType(forIdentifier: .dietaryCalcium)
        case "dietaryIron":
            quantityType = HKQuantityType.quantityType(forIdentifier: .dietaryIron)
        case "dietaryPotassium":
            quantityType = HKQuantityType.quantityType(forIdentifier: .dietaryPotassium)
        case "dietaryVitaminA":
            quantityType = HKQuantityType.quantityType(forIdentifier: .dietaryVitaminA)
        case "dietaryVitaminC":
            quantityType = HKQuantityType.quantityType(forIdentifier: .dietaryVitaminC)
        case "dietaryVitaminD":
            quantityType = HKQuantityType.quantityType(forIdentifier: .dietaryVitaminD)
            
        // Activity metrics
        case "exerciseTime":
            quantityType = HKQuantityType.quantityType(forIdentifier: .appleExerciseTime)
        case "standTime":
            quantityType = HKQuantityType.quantityType(forIdentifier: .appleStandTime)
        case "walkingSpeed":
            quantityType = HKQuantityType.quantityType(forIdentifier: .walkingSpeed)
            
        // iOS 16+ metrics
        case "runningSpeed":
            if #available(iOS 16.0, *) {
                quantityType = HKQuantityType.quantityType(forIdentifier: .runningSpeed)
            } else {
                call.reject("Running speed is only available on iOS 16+")
                return
            }
        case "runningPower":
            if #available(iOS 16.0, *) {
                quantityType = HKQuantityType.quantityType(forIdentifier: .runningPower)
            } else {
                call.reject("Running power is only available on iOS 16+")
                return
            }
            
        // iOS 17+ metrics
        case "timeInDaylight":
            if #available(iOS 17.0, *) {
                quantityType = HKQuantityType.quantityType(forIdentifier: .timeInDaylight)
            } else {
                call.reject("Time in daylight data is only available on iOS 17+")
                return
            }
            
        default:
            call.reject("Unsupported data type")
            return
        }
        
        guard let type = quantityType else {
            call.reject("Invalid data type")
            return
        }
        
        // Enable background delivery for this type
        enableBackgroundDelivery(for: type)
        
        // Set up the time range
        let now = Date()
        var startDate: Date
        
        switch period {
        case "day":
            startDate = Calendar.current.date(byAdding: .day, value: -1, to: now)!
        case "week":
            startDate = Calendar.current.date(byAdding: .day, value: -7, to: now)!
        case "month":
            startDate = Calendar.current.date(byAdding: .month, value: -1, to: now)!
        case "year":
            startDate = Calendar.current.date(byAdding: .year, value: -1, to: now)!
        default:
            startDate = Calendar.current.date(byAdding: .day, value: -1, to: now)!
        }
        
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: now, options: .strictStartDate)
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        
        // Define the query with validation
        let query = HKSampleQuery(sampleType: type, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: [sortDescriptor]) { [weak self] (query, samples, error) in
            guard let self = self else { return }
            
            guard error == nil else {
                call.reject("Error querying data: \(error!.localizedDescription)")
                return
            }
            
            guard let samples = samples as? [HKQuantitySample] else {
                call.resolve(["data": []])
                return
            }
            
            // Process and validate the samples
            var results: [[String: Any]] = []
            let dateFormatter = ISO8601DateFormatter()
            
            for sample in samples {
                // Validate the sample
                guard self.validateHealthData(sample, for: dataType) else {
                    print("Invalid sample detected for \(dataType), skipping")
                    continue
                }
                
                var unit: HKUnit
                var value: Double
                
                switch dataType {
                // Core metrics
                case "heartRate":
                    unit = HKUnit.count().unitDivided(by: HKUnit.minute())
                    value = sample.quantity.doubleValue(for: unit)
                case "steps":
                    unit = HKUnit.count()
                    value = sample.quantity.doubleValue(for: unit)
                case "weight":
                    unit = HKUnit.gramUnit(with: .kilo)
                    value = sample.quantity.doubleValue(for: unit)
                case "vo2max":
                    unit = HKUnit.literUnit(with: .milli).unitDivided(by: HKUnit.gramUnit(with: .kilo).unitMultiplied(by: HKUnit.minute()))
                    value = sample.quantity.doubleValue(for: unit)
                case "calories":
                    unit = HKUnit.kilocalorie()
                    value = sample.quantity.doubleValue(for: unit)
                case "distance":
                    unit = HKUnit.meter()
                    value = sample.quantity.doubleValue(for: unit)
                case "restingHeartRate":
                    unit = HKUnit.count().unitDivided(by: HKUnit.minute())
                    value = sample.quantity.doubleValue(for: unit)
                case "heartRateVariability":
                    unit = HKUnit.secondUnit(with: .milli)
                    value = sample.quantity.doubleValue(for: unit)
                
                // Cardiovascular & Respiratory metrics
                case "oxygenSaturation":
                    unit = HKUnit.percent()
                    value = sample.quantity.doubleValue(for: unit) * 100 // Convert decimal to percentage
                case "respiratoryRate":
                    unit = HKUnit.count().unitDivided(by: HKUnit.minute())
                    value = sample.quantity.doubleValue(for: unit)
                case "bodyTemperature":
                    unit = HKUnit.degreeCelsius()
                    value = sample.quantity.doubleValue(for: unit)
                
                // Energy & basic nutrition metrics
                case "basalEnergy":
                    unit = HKUnit.kilocalorie()
                    value = sample.quantity.doubleValue(for: unit)
                case "dietaryEnergy":
                    unit = HKUnit.kilocalorie()
                    value = sample.quantity.doubleValue(for: unit)
                case "dietaryProtein":
                    unit = HKUnit.gram()
                    value = sample.quantity.doubleValue(for: unit)
                case "dietaryCarbs":
                    unit = HKUnit.gram()
                    value = sample.quantity.doubleValue(for: unit)
                case "dietaryFat":
                    unit = HKUnit.gram()
                    value = sample.quantity.doubleValue(for: unit)
                case "dietaryWater":
                    unit = HKUnit.literUnit(with: .milli)
                    value = sample.quantity.doubleValue(for: unit) / 1000 // Convert ml to liters
                
                // Detailed nutritional data
                case "dietaryFiber", "dietarySugar", "dietarySodium", "dietaryCholesterol":
                    unit = HKUnit.gram()
                    value = sample.quantity.doubleValue(for: unit)
                
                // Micronutrients
                case "dietaryCalcium", "dietaryIron", "dietaryPotassium":
                    unit = HKUnit.gram()
                    value = sample.quantity.doubleValue(for: unit)
                case "dietaryVitaminA", "dietaryVitaminC", "dietaryVitaminD":
                    unit = HKUnit.gram()
                    value = sample.quantity.doubleValue(for: unit)
                
                // Activity metrics
                case "exerciseTime", "standTime":
                    unit = HKUnit.minute()
                    value = sample.quantity.doubleValue(for: unit)
                case "runningSpeed", "walkingSpeed":
                    unit = HKUnit.meter().unitDivided(by: HKUnit.second())
                    value = sample.quantity.doubleValue(for: unit)
                case "runningPower":
                    if #available(iOS 16.0, *) {
                        unit = HKUnit.watt()
                        value = sample.quantity.doubleValue(for: unit)
                    } else {
                        // This should never happen as we check availability earlier
                        continue
                    }
                
                // Environmental data
                case "timeInDaylight":
                    if #available(iOS 17.0, *) {
                        unit = HKUnit.second()
                        value = sample.quantity.doubleValue(for: unit) / 60.0 // Convert to minutes
                    } else {
                        // This should never happen as we check availability earlier
                        continue
                    }
                
                default:
                    continue
                }
                
                // Clean metadata to ensure JSON serialization
                var cleanMetadata: [String: Any] = [:]
                if let metadata = sample.metadata {
                    for (key, value) in metadata {
                        // Convert non-serializable values to strings
                        if let stringValue = value as? String {
                            cleanMetadata[key] = stringValue
                        } else if let numberValue = value as? NSNumber {
                            cleanMetadata[key] = numberValue.doubleValue
                        } else if let boolValue = value as? Bool {
                            cleanMetadata[key] = boolValue
                        } else {
                            cleanMetadata[key] = "\(value)"
                        }
                    }
                }
                
                results.append([
                    "date": dateFormatter.string(from: sample.startDate),
                    "endDate": dateFormatter.string(from: sample.endDate),
                    "value": value,
                    "unit": unit.unitString,
                    "source": sample.sourceRevision.source.name,
                    "metadata": cleanMetadata
                ])
            }
            
            // Cache the results
            self.cache.setObject(results as NSArray, forKey: "\(dataType)_\(period)" as NSString)
            self.lastQueryTimes[dataType] = Date()
            
            call.resolve(["data": results])
        }
        
        healthStore.execute(query)
    }
    
    @objc func queryWorkouts(_ call: CAPPluginCall) {
        let period = call.getString("period") ?? "month"
        
        // Set up the time range
        let now = Date()
        var startDate: Date
        
        switch period {
        case "day":
            startDate = Calendar.current.date(byAdding: .day, value: -1, to: now)!
        case "week":
            startDate = Calendar.current.date(byAdding: .day, value: -7, to: now)!
        case "month":
            startDate = Calendar.current.date(byAdding: .month, value: -1, to: now)!
        case "year":
            startDate = Calendar.current.date(byAdding: .year, value: -1, to: now)!
        default:
            startDate = Calendar.current.date(byAdding: .month, value: -1, to: now)!
        }
        
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: now, options: .strictStartDate)
        
        // Sort by date (newest first)
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        
        let query = HKSampleQuery(sampleType: HKObjectType.workoutType(), predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: [sortDescriptor]) { (query, samples, error) in
            guard error == nil else {
                call.reject("Error querying workouts: \(error!.localizedDescription)")
                return
            }
            
            guard let workouts = samples as? [HKWorkout] else {
                call.resolve(["data": []])
                return
            }
            
            // Process the workouts
            var results: [[String: Any]] = []
            let dateFormatter = ISO8601DateFormatter()
            
            for workout in workouts {
                let duration = workout.duration / 60 // Convert to minutes
                
                var workoutType = "other"
                switch workout.workoutActivityType {
                case .running:
                    workoutType = "running"
                case .cycling:
                    workoutType = "cycling"
                case .walking:
                    workoutType = "walking"
                case .swimming:
                    workoutType = "swimming"
                case .functionalStrengthTraining:
                    workoutType = "strength"
                case .traditionalStrengthTraining:
                    workoutType = "strength"
                case .highIntensityIntervalTraining:
                    workoutType = "hiit"
                case .yoga:
                    workoutType = "yoga"
                default:
                    workoutType = "other"
                }
                
                var workoutData: [String: Any] = [
                    "date": dateFormatter.string(from: workout.startDate),
                    "endDate": dateFormatter.string(from: workout.endDate),
                    "duration": duration,
                    "type": workoutType,
                    "source": workout.sourceRevision.source.name
                ]
                
                // Add energy burned if available
                if let energyBurned = workout.totalEnergyBurned {
                    workoutData["calories"] = energyBurned.doubleValue(for: HKUnit.kilocalorie())
                }
                
                // Add distance if available
                if let distance = workout.totalDistance {
                    workoutData["distance"] = distance.doubleValue(for: HKUnit.meter())
                }
                
                results.append(workoutData)
            }
            
            call.resolve(["data": results])
        }
        
        healthStore.execute(query)
    }
    
    @objc func querySleepData(_ call: CAPPluginCall) {
        let period = call.getString("period") ?? "week"
        let forceRefresh = call.getBool("forceRefresh") ?? false
        
        // Check cache if force refresh isn't requested
        if !forceRefresh {
            let cacheKey = "sleep_\(period)" as NSString
            if let cachedResults = cache.object(forKey: cacheKey) as? [[String: Any]],
               let lastQueryTime = lastQueryTimes["sleep"],
               Date().timeIntervalSince(lastQueryTime) < cacheExpirationTime {
                call.resolve(["data": cachedResults])
                return
            }
        }
        
        guard let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) else {
            call.reject("Sleep analysis not available")
            return
        }
        
        // Set up the time range
        let now = Date()
        var startDate: Date
        
        switch period {
        case "day":
            startDate = Calendar.current.date(byAdding: .day, value: -1, to: now)!
        case "week":
            startDate = Calendar.current.date(byAdding: .day, value: -7, to: now)!
        case "month":
            startDate = Calendar.current.date(byAdding: .month, value: -1, to: now)!
        case "year":
            startDate = Calendar.current.date(byAdding: .year, value: -1, to: now)!
        default:
            startDate = Calendar.current.date(byAdding: .day, value: -7, to: now)!
        }
        
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: now, options: .strictStartDate)
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        
        let query = HKSampleQuery(sampleType: sleepType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: [sortDescriptor]) { [weak self] (query, samples, error) in
            guard let self = self else { return }
            
            guard error == nil else {
                call.reject("Error querying sleep data: \(error!.localizedDescription)")
                return
            }
            
            guard let samples = samples as? [HKCategorySample] else {
                call.resolve(["data": []])
                return
            }
            
            // Process the sleep samples
            var results: [[String: Any]] = []
            let dateFormatter = ISO8601DateFormatter()
            
            // Group sleep samples by night
            let calendar = Calendar.current
            var sleepSamplesByNight: [String: [HKCategorySample]] = [:]
            
            for sample in samples {
                let isAsleep = sample.value == HKCategoryValueSleepAnalysis.asleep.rawValue ||
                               sample.value == HKCategoryValueSleepAnalysis.inBed.rawValue
                
                if isAsleep {
                    // Use the end date to determine the night (since sleep often spans midnight)
                    let nightDateComponents = calendar.dateComponents([.year, .month, .day], from: sample.endDate)
                    let nightKey = "\(nightDateComponents.year!)-\(nightDateComponents.month!)-\(nightDateComponents.day!)"
                    
                    if sleepSamplesByNight[nightKey] == nil {
                        sleepSamplesByNight[nightKey] = []
                    }
                    
                    sleepSamplesByNight[nightKey]?.append(sample)
                }
            }
            
            // Process each night's sleep
            for (_, samples) in sleepSamplesByNight {
                if samples.isEmpty { continue }
                
                // Find the earliest start and latest end time for this night
                var earliestStart = samples[0].startDate
                var latestEnd = samples[0].endDate
                var totalSleepMinutes: TimeInterval = 0
                var sleepStages: [String: TimeInterval] = [
                    "deep": 0,
                    "core": 0,
                    "rem": 0,
                    "awake": 0
                ]
                
                for sample in samples {
                    if sample.startDate < earliestStart {
                        earliestStart = sample.startDate
                    }
                    
                    if sample.endDate > latestEnd {
                        latestEnd = sample.endDate
                    }
                    
                    let sampleDuration = sample.endDate.timeIntervalSince(sample.startDate) / 60 // in minutes
                    
                    // Process sleep stages if available
                    if #available(iOS 16.0, *) {
                        if sample.value == HKCategoryValueSleepAnalysis.asleepDeep.rawValue {
                            sleepStages["deep"]! += sampleDuration
                            totalSleepMinutes += sampleDuration
                        } else if sample.value == HKCategoryValueSleepAnalysis.asleepCore.rawValue {
                            sleepStages["core"]! += sampleDuration
                            totalSleepMinutes += sampleDuration
                        } else if sample.value == HKCategoryValueSleepAnalysis.asleepREM.rawValue {
                            sleepStages["rem"]! += sampleDuration
                            totalSleepMinutes += sampleDuration
                        } else if sample.value == HKCategoryValueSleepAnalysis.awake.rawValue {
                            sleepStages["awake"]! += sampleDuration
                        } else if sample.value == HKCategoryValueSleepAnalysis.asleep.rawValue {
                            totalSleepMinutes += sampleDuration
                        }
                    } else {
                        // Fallback on earlier versions
                        if sample.value == HKCategoryValueSleepAnalysis.asleep.rawValue {
                            totalSleepMinutes += sampleDuration
                        }
                    }
                }
                
                // Calculate total time in bed
                let timeInBedMinutes = latestEnd.timeIntervalSince(earliestStart) / 60
                
                // Calculate sleep efficiency (percentage of time in bed spent sleeping)
                let sleepEfficiency = timeInBedMinutes > 0 ? (totalSleepMinutes / timeInBedMinutes) * 100 : 0
                
                // Convert total sleep to hours for backward compatibility
                let totalSleepHours = totalSleepMinutes / 60
                
                var resultData: [String: Any] = [
                    "date": dateFormatter.string(from: earliestStart),
                    "endDate": dateFormatter.string(from: latestEnd),
                    "value": totalSleepHours,
                    "unit": "hours",
                    "timeInBed": timeInBedMinutes / 60,
                    "sleepEfficiency": sleepEfficiency,
                    "source": samples[0].sourceRevision.source.name
                ]
                
                // Add sleep stages if available
                if #available(iOS 16.0, *) {
                    resultData["stages"] = [
                        "deep": sleepStages["deep"]! / 60,
                        "core": sleepStages["core"]! / 60,
                        "rem": sleepStages["rem"]! / 60,
                        "awake": sleepStages["awake"]! / 60
                    ]
                }
                
                results.append(resultData)
            }
            
            // Sort by date (newest first)
            results.sort { (a, b) -> Bool in
                guard let dateA = a["date"] as? String, let dateB = b["date"] as? String else {
                    return false
                }
                return dateA > dateB
            }
            
            // Cache the results
            self.cache.setObject(results as NSArray, forKey: "sleep_\(period)" as NSString)
            self.lastQueryTimes["sleep"] = Date()
            
            call.resolve(["data": results])
        }
        
        healthStore.execute(query)
    }
    
    @objc func startObservingHealthData(_ call: CAPPluginCall) {
        let dataType = call.getString("dataType") ?? ""
        
        // Get appropriate sample type
        var sampleType: HKSampleType?
        
        switch dataType {
        // Core metrics
        case "heartRate":
            sampleType = HKQuantityType.quantityType(forIdentifier: .heartRate)
        case "steps":
            sampleType = HKQuantityType.quantityType(forIdentifier: .stepCount)
        case "weight":
            sampleType = HKQuantityType.quantityType(forIdentifier: .bodyMass)
        case "vo2max":
            sampleType = HKQuantityType.quantityType(forIdentifier: .vo2Max)
        case "sleep":
            sampleType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis)
        case "calories":
            sampleType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned)
        case "distance":
            sampleType = HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning)
        case "restingHeartRate":
            sampleType = HKQuantityType.quantityType(forIdentifier: .restingHeartRate)
        case "heartRateVariability":
            sampleType = HKQuantityType.quantityType(forIdentifier: .heartRateVariabilitySDNN)
        case "workouts":
            sampleType = HKObjectType.workoutType()
            
        // Cardiovascular & Respiratory metrics
        case "oxygenSaturation":
            sampleType = HKQuantityType.quantityType(forIdentifier: .oxygenSaturation)
        case "respiratoryRate":
            sampleType = HKQuantityType.quantityType(forIdentifier: .respiratoryRate)
        case "bodyTemperature":
            sampleType = HKQuantityType.quantityType(forIdentifier: .bodyTemperature)
            
        // Energy & nutrition metrics
        case "basalEnergy":
            sampleType = HKQuantityType.quantityType(forIdentifier: .basalEnergyBurned)
        case "dietaryEnergy":
            sampleType = HKQuantityType.quantityType(forIdentifier: .dietaryEnergyConsumed)
        case "dietaryProtein":
            sampleType = HKQuantityType.quantityType(forIdentifier: .dietaryProtein)
        case "dietaryCarbs":
            sampleType = HKQuantityType.quantityType(forIdentifier: .dietaryCarbohydrates)
        case "dietaryFat":
            sampleType = HKQuantityType.quantityType(forIdentifier: .dietaryFatTotal)
        case "dietaryWater":
            sampleType = HKQuantityType.quantityType(forIdentifier: .dietaryWater)
            
        // Activity metrics
        case "exerciseTime":
            sampleType = HKQuantityType.quantityType(forIdentifier: .appleExerciseTime)
        case "standTime":
            sampleType = HKQuantityType.quantityType(forIdentifier: .appleStandTime)
        case "walkingSpeed":
            sampleType = HKQuantityType.quantityType(forIdentifier: .walkingSpeed)
            
        // iOS 16+ metrics
        case "runningSpeed":
            if #available(iOS 16.0, *) {
                sampleType = HKQuantityType.quantityType(forIdentifier: .runningSpeed)
            } else {
                call.reject("Running speed is only available on iOS 16+")
                return
            }
        case "runningPower":
            if #available(iOS 16.0, *) {
                sampleType = HKQuantityType.quantityType(forIdentifier: .runningPower)
            } else {
                call.reject("Running power is only available on iOS 16+")
                return
            }
            
        // iOS 17+ metrics
        case "timeInDaylight":
            if #available(iOS 17.0, *) {
                sampleType = HKQuantityType.quantityType(forIdentifier: .timeInDaylight)
            } else {
                call.reject("Time in daylight data is only available on iOS 17+")
                return
            }
            
        // Category types
        case "mindfulSession":
            sampleType = HKObjectType.categoryType(forIdentifier: .mindfulSession)
            
        default:
            call.reject("Unsupported data type")
            return
        }
        
        guard let type = sampleType else {
            call.reject("Invalid data type")
            return
        }
        
        // Stop existing observer if any
        if let existingQuery = observers[dataType] {
            healthStore.stop(existingQuery)
        }
        
        // Create observer query
        let query = HKObserverQuery(sampleType: type, predicate: nil) { [weak self] (query, completionHandler, error) in
            guard let self = self else { return }
            
            if let error = error {
                print("Observer query error: \(error.localizedDescription)")
                return
            }
            
            // Clear cache for this data type
            // NSCache doesn't have an allKeys property, just clear the entry for this specific data type
            self.cache.removeObject(forKey: "\(dataType)_day" as NSString)
            self.cache.removeObject(forKey: "\(dataType)_week" as NSString)
            self.cache.removeObject(forKey: "\(dataType)_month" as NSString)
            self.cache.removeObject(forKey: "\(dataType)_year" as NSString)
            
            // Notify JavaScript when new data is available
            self.notifyListeners("healthKitUpdate", data: [
                "dataType": dataType,
                "timestamp": ISO8601DateFormatter().string(from: Date())
            ])
            
            // Complete the background delivery
            completionHandler()
        }
        
        // Save the query for later cleanup
        observers[dataType] = query
        
        // Execute the query
        healthStore.execute(query)
        
        // Enable background delivery if needed
        healthStore.enableBackgroundDelivery(for: type, frequency: .immediate) { (success, error) in
            if let error = error {
                print("Failed to enable background delivery: \(error.localizedDescription)")
            }
        }
        
        call.resolve()
    }
    
    @objc func stopObservingHealthData(_ call: CAPPluginCall) {
        let dataType = call.getString("dataType") ?? ""
        
        if let query = observers[dataType] {
            healthStore.stop(query)
            observers.removeValue(forKey: dataType)
        }
        
        call.resolve()
    }
    
    @objc func clearCache(_ call: CAPPluginCall) {
        cache.removeAllObjects()
        lastQueryTimes.removeAll()
        call.resolve()
    }
    
    // Clean up observers when plugin is about to be deallocated
    deinit {
        for (_, query) in observers {
            healthStore.stop(query)
        }
    }
}