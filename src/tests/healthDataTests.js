import { act, renderHook } from "@testing-library/react-hooks";
import { useAppleHealth } from "../hooks/useAppleHealth";
import {
  fetchHealthData,
  fetchMultipleHealthData,
} from "../services/appleHealthService";

// Mock the appleHealthService
jest.mock("../services/appleHealthService", () => ({
  isHealthKitAvailable: jest.fn(),
  requestHealthKitPermissions: jest.fn(),
  fetchHealthData: jest.fn(),
  fetchMultipleHealthData: jest.fn(),
  startObservingHealthData: jest.fn(),
  clearHealthDataCache: jest.fn(),
}));

describe("Health Data Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Sleep Data Tests", () => {
    const mockSleepData = [
      {
        date: "2024-03-20T22:00:00Z",
        endDate: "2024-03-21T06:00:00Z",
        value: 8,
        unit: "hours",
        timeInBed: 8.5,
        sleepEfficiency: 94.1,
        stages: {
          deep: 1.5,
          core: 4.2,
          rem: 1.8,
          awake: 0.5,
        },
        source: "Apple Watch",
      },
    ];

    test("should fetch and validate sleep data correctly", async () => {
      fetchHealthData.mockResolvedValueOnce(mockSleepData);

      const { result, waitForNextUpdate } = renderHook(() =>
        useAppleHealth("sleep", "day")
      );

      await waitForNextUpdate();

      expect(result.current.data).toEqual(mockSleepData);
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBeFalsy();
    });

    test("should validate sleep data structure", async () => {
      const invalidSleepData = [
        {
          date: "2024-03-20T22:00:00Z",
          // Missing endDate
          value: 8,
          unit: "hours",
        },
      ];

      fetchHealthData.mockResolvedValueOnce(invalidSleepData);

      const { result, waitForNextUpdate } = renderHook(() =>
        useAppleHealth("sleep", "day")
      );

      await waitForNextUpdate();

      expect(result.current.data).toEqual([]);
      expect(result.current.error).toBeTruthy();
    });

    test("should handle sleep stage calculations correctly", async () => {
      const sleepDataWithStages = [
        {
          date: "2024-03-20T22:00:00Z",
          endDate: "2024-03-21T06:00:00Z",
          value: 8,
          unit: "hours",
          timeInBed: 8.5,
          sleepEfficiency: 94.1,
          stages: {
            deep: 1.5,
            core: 4.2,
            rem: 1.8,
            awake: 0.5,
          },
        },
      ];

      fetchHealthData.mockResolvedValueOnce(sleepDataWithStages);

      const { result, waitForNextUpdate } = renderHook(() =>
        useAppleHealth("sleep", "day")
      );

      await waitForNextUpdate();

      const sleepData = result.current.data[0];
      expect(
        sleepData.stages.deep + sleepData.stages.core + sleepData.stages.rem
      ).toBeCloseTo(sleepData.value, 1);
      expect(sleepData.sleepEfficiency).toBeGreaterThan(0);
      expect(sleepData.sleepEfficiency).toBeLessThanOrEqual(100);
    });
  });

  describe("Multiple Health Data Tests", () => {
    const mockMultipleData = {
      heartRate: [
        {
          date: "2024-03-21T10:00:00Z",
          value: 72,
          unit: "count/min",
          source: "Apple Watch",
        },
      ],
      steps: [
        {
          date: "2024-03-21T10:00:00Z",
          value: 5000,
          unit: "count",
          source: "Apple Watch",
        },
      ],
    };

    test("should fetch multiple health data types correctly", async () => {
      fetchMultipleHealthData.mockResolvedValueOnce(mockMultipleData);

      const { result, waitForNextUpdate } = renderHook(() =>
        useAppleHealth(["heartRate", "steps"], "day")
      );

      await waitForNextUpdate();

      expect(result.current.data).toEqual(mockMultipleData);
      expect(result.current.error).toBeNull();
    });

    test("should handle retries on failure", async () => {
      fetchMultipleHealthData
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce(mockMultipleData);

      const { result, waitForNextUpdate } = renderHook(() =>
        useAppleHealth(["heartRate", "steps"], "day", { maxRetries: 3 })
      );

      await waitForNextUpdate();

      expect(result.current.data).toEqual(mockMultipleData);
      expect(result.current.error).toBeNull();
      expect(fetchMultipleHealthData).toHaveBeenCalledTimes(3);
    });
  });

  describe("Data Validation Tests", () => {
    test("should validate heart rate data ranges", async () => {
      const invalidHeartRateData = [
        {
          date: "2024-03-21T10:00:00Z",
          value: 300, // Invalid heart rate
          unit: "count/min",
          source: "Apple Watch",
        },
      ];

      fetchHealthData.mockResolvedValueOnce(invalidHeartRateData);

      const { result, waitForNextUpdate } = renderHook(() =>
        useAppleHealth("heartRate", "day")
      );

      await waitForNextUpdate();

      expect(result.current.data).toEqual([]);
      expect(result.current.error).toBeTruthy();
    });

    test("should validate step count data ranges", async () => {
      const invalidStepData = [
        {
          date: "2024-03-21T10:00:00Z",
          value: -1000, // Invalid step count
          unit: "count",
          source: "Apple Watch",
        },
      ];

      fetchHealthData.mockResolvedValueOnce(invalidStepData);

      const { result, waitForNextUpdate } = renderHook(() =>
        useAppleHealth("steps", "day")
      );

      await waitForNextUpdate();

      expect(result.current.data).toEqual([]);
      expect(result.current.error).toBeTruthy();
    });
  });

  describe("Cache and Refresh Tests", () => {
    test("should use cached data when available", async () => {
      const mockData = [
        {
          date: "2024-03-21T10:00:00Z",
          value: 72,
          unit: "count/min",
          source: "Apple Watch",
        },
      ];

      fetchHealthData.mockResolvedValueOnce(mockData);

      const { result, waitForNextUpdate } = renderHook(() =>
        useAppleHealth("heartRate", "day")
      );

      await waitForNextUpdate();

      // Second call should use cache
      await act(async () => {
        await result.current.refreshData();
      });

      expect(fetchHealthData).toHaveBeenCalledTimes(1);
    });

    test("should force refresh when requested", async () => {
      const mockData = [
        {
          date: "2024-03-21T10:00:00Z",
          value: 72,
          unit: "count/min",
          source: "Apple Watch",
        },
      ];

      fetchHealthData.mockResolvedValue(mockData);

      const { result, waitForNextUpdate } = renderHook(() =>
        useAppleHealth("heartRate", "day")
      );

      await waitForNextUpdate();

      await act(async () => {
        await result.current.refreshData();
      });

      expect(fetchHealthData).toHaveBeenCalledTimes(2);
      expect(fetchHealthData).toHaveBeenLastCalledWith(
        "heartRate",
        "day",
        true
      );
    });
  });
});
