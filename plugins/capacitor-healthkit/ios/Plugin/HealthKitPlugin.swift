import Foundation
import Capacitor
import HealthKit

@objc(HealthKitPlugin)
public class HealthKitPlugin: CAPPlugin {
    private let healthStore = HKHealthStore()
    private var observers: [String: HKObserverQuery] = [:]
    
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
        let typesToRead: Set<HKObjectType> = [
            HKObjectType.quantityType(forIdentifier: .heartRate)!,
            HKObjectType.quantityType(forIdentifier: .stepCount)!,
            HKObjectType.quantityType(forIdentifier: .bodyMass)!,
            HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!,
            HKObjectType.quantityType(forIdentifier: .vo2Max)!
        ]
        
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
        let period = call.getString("period") ?? "day" // day, week, month
        
        // Determine the quantity type based on the data type
        var quantityType: HKQuantityType?
        
        switch dataType {
        case "heartRate":
            quantityType = HKQuantityType.quantityType(forIdentifier: .heartRate)
        case "steps":
            quantityType = HKQuantityType.quantityType(forIdentifier: .stepCount)
        case "weight":
            quantityType = HKQuantityType.quantityType(forIdentifier: .bodyMass)
        case "vo2max":
            quantityType = HKQuantityType.quantityType(forIdentifier: .vo2Max)
        default:
            call.reject("Unsupported data type")
            return
        }
        
        guard let type = quantityType else {
            call.reject("Invalid data type")
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
        default:
            startDate = Calendar.current.date(byAdding: .day, value: -1, to: now)!
        }
        
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: now, options: .strictStartDate)
        
        // Define the query
        let query = HKSampleQuery(sampleType: type, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { (query, samples, error) in
            guard error == nil else {
                call.reject("Error querying data: \(error!.localizedDescription)")
                return
            }
            
            guard let samples = samples as? [HKQuantitySample] else {
                call.resolve(["data": []])
                return
            }
            
            // Process the samples into a format for JavaScript
            var results: [[String: Any]] = []
            
            for sample in samples {
                var unit: HKUnit
                var value: Double
                
                switch dataType {
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
                default:
                    continue
                }
                
                results.append([
                    "date": ISO8601DateFormatter().string(from: sample.startDate),
                    "value": value,
                    "unit": unit.description
                ])
            }
            
            call.resolve(["data": results])
        }
        
        healthStore.execute(query)
    }
    
    @objc func querySleepData(_ call: CAPPluginCall) {
        let period = call.getString("period") ?? "day" // day, week, month
        
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
        default:
            startDate = Calendar.current.date(byAdding: .day, value: -1, to: now)!
        }
        
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: now, options: .strictStartDate)
        
        let query = HKSampleQuery(sampleType: sleepType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { (query, samples, error) in
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
            
            for sample in samples {
                let value = sample.value
                let isAsleep = value == HKCategoryValueSleepAnalysis.asleep.rawValue
                
                if isAsleep {
                    let duration = sample.endDate.timeIntervalSince(sample.startDate) / 3600 // Convert to hours
                    
                    results.append([
                        "date": ISO8601DateFormatter().string(from: sample.startDate),
                        "value": duration,
                        "unit": "hours",
                        "endDate": ISO8601DateFormatter().string(from: sample.endDate)
                    ])
                }
            }
            
            call.resolve(["data": results])
        }
        
        healthStore.execute(query)
    }
    
    @objc func startObservingHealthData(_ call: CAPPluginCall) {
        let dataType = call.getString("dataType") ?? ""
        
        // Determine the quantity type based on the data type
        var quantityType: HKQuantityType?
        
        switch dataType {
        case "heartRate":
            quantityType = HKQuantityType.quantityType(forIdentifier: .heartRate)
        case "steps":
            quantityType = HKQuantityType.quantityType(forIdentifier: .stepCount)
        case "weight":
            quantityType = HKQuantityType.quantityType(forIdentifier: .bodyMass)
        case "vo2max":
            quantityType = HKQuantityType.quantityType(forIdentifier: .vo2Max)
        default:
            call.reject("Unsupported data type")
            return
        }
        
        guard let type = quantityType else {
            call.reject("Invalid data type")
            return
        }
        
        // Create observer query
        let query = HKObserverQuery(sampleType: type, predicate: nil) { [weak self] (query, completionHandler, error) in
            guard let self = self else { return }
            
            if let error = error {
                print("Observer query error: \(error.localizedDescription)")
                return
            }
            
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
}