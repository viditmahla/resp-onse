import requests
import sys
import json
from datetime import datetime

class ERWBackendTester:
    def __init__(self, base_url="https://omega-analysis-tool.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failures = []

    def run_test(self, name, method, endpoint, expected_status=200, params=None, data=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                    elif isinstance(response_data, dict):
                        print(f"   Response: Dict with keys: {list(response_data.keys())}")
                    return True, response_data
                except:
                    print(f"   Response: {response.text[:100]}...")
                    return True, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.failures.append({
                    "test": name,
                    "endpoint": endpoint,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failures.append({
                "test": name,
                "endpoint": endpoint,
                "error": str(e)
            })
            return False, {}

    def test_dashboard_overview(self):
        """Test dashboard overview KPIs"""
        success, data = self.run_test(
            "Dashboard Overview", "GET", "/dashboard/overview",
            params={"feedstock": "calcite", "omega": 5}
        )
        if success and isinstance(data, dict):
            required_fields = ['total_cdr_t_yr', 'avg_cdr_t_yr', 'total_samples', 'success_rate']
            for field in required_fields:
                if field not in data:
                    print(f"⚠️  Missing required field: {field}")
                    return False
            print(f"   Total CDR: {data.get('total_cdr_t_yr', 0):.2f} t/yr")
            print(f"   Total Samples: {data.get('total_samples', 0)}")
            print(f"   Success Rate: {data.get('success_rate', 0):.1f}%")
        return success

    def test_regions_cdr(self):
        """Test regions CDR data for bar chart"""
        success, data = self.run_test(
            "Regions CDR", "GET", "/regions/cdr",
            params={"feedstock": "calcite", "omega": 5}
        )
        if success and isinstance(data, list):
            print(f"   Found {len(data)} regions with CDR data")
            for region in data[:3]:  # Show first 3
                print(f"   - {region.get('region', 'Unknown')}: {region.get('total_cdr', 0):.2f} t/yr")
        return success

    def test_samples(self):
        """Test samples endpoint"""
        success, data = self.run_test(
            "Samples", "GET", "/samples",
            params={"feedstock": "calcite", "omega": 5, "limit": 10}
        )
        if success and isinstance(data, dict):
            samples = data.get('samples', [])
            total = data.get('total', 0)
            print(f"   Found {total} total samples, returned {len(samples)}")
            if samples:
                sample = samples[0]
                print(f"   Sample fields: {list(sample.keys())[:5]}...")
        return success

    def test_feedstocks(self):
        """Test feedstocks list"""
        success, data = self.run_test("Feedstocks", "GET", "/feedstocks")
        if success and isinstance(data, list):
            print(f"   Found {len(data)} feedstocks")
            for fs in data:
                print(f"   - {fs.get('name', 'Unknown')}: {fs.get('omega_thresholds', [])}")
        return success

    def test_comparison(self):
        """Test omega comparison data"""
        success, data = self.run_test(
            "Comparison", "GET", "/comparison",
            params={"feedstock": "calcite"}
        )
        if success and isinstance(data, list):
            print(f"   Found {len(data)} omega threshold comparisons")
            for comp in data:
                omega = comp.get('omega_threshold', 'Unknown')
                total_cdr = comp.get('total_cdr', 0)
                samples = comp.get('total_samples', 0)
                print(f"   - Omega {omega}: {total_cdr:.2f} t/yr ({samples} samples)")
        return success

    def test_top_rivers(self):
        """Test top rivers data"""
        success, data = self.run_test(
            "Top Rivers", "GET", "/rivers/top",
            params={"feedstock": "calcite", "omega": 5, "limit": 5}
        )
        if success and isinstance(data, list):
            print(f"   Found {len(data)} top rivers")
            for river in data[:3]:
                print(f"   - {river.get('river', 'Unknown')}: {river.get('total_cdr', 0):.2f} t/yr")
        return success

    def test_summary(self):
        """Test summary statistics"""
        success, data = self.run_test(
            "Summary Statistics", "GET", "/summary",
            params={"feedstock": "calcite", "omega": 5}
        )
        if success and isinstance(data, list):
            print(f"   Found {len(data)} summary entries")
        return success

    def test_filters(self):
        """Test filters endpoint"""
        success, data = self.run_test(
            "Filters", "GET", "/filters",
            params={"feedstock": "calcite", "omega": 5}
        )
        if success and isinstance(data, dict):
            regions = data.get('regions', [])
            states = data.get('states', [])
            print(f"   Available regions: {len(regions)}")
            print(f"   Available states: {len(states)}")
        return success

    def test_analytics_full(self):
        """Test analytics full data (new endpoint)"""
        success, data = self.run_test(
            "Analytics Full", "GET", "/analytics/full",
            params={"feedstock": "calcite", "omega": 5}
        )
        if success and isinstance(data, list):
            print(f"   Found {len(data)} analytics records")
            if data:
                fields = list(data[0].keys())
                print(f"   Available fields: {fields[:8]}...")
                # Check for key fields needed by analytics tabs
                key_fields = ['ph', 'alkalinity', 'ca', 'mg', 'hco3', 'dic', 'pco2', 'si_calcite', 'nicb', 'region']
                missing = [f for f in key_fields if f not in fields]
                if missing:
                    print(f"   ⚠️  Missing key fields: {missing}")
                else:
                    print(f"   ✅ All key analytics fields present")
        return success

    def test_analytics_basin_stats(self):
        """Test analytics basin stats (new endpoint)"""
        success, data = self.run_test(
            "Analytics Basin Stats", "GET", "/analytics/basin-stats",
            params={"feedstock": "calcite", "omega": 5}
        )
        if success and isinstance(data, list):
            print(f"   Found {len(data)} basin statistics")
            if data:
                fields = list(data[0].keys())
                print(f"   Basin stat fields: {fields[:6]}...")
        return success

    def test_analytics_nicb_quality(self):
        """Test analytics NICB quality (new endpoint)"""
        success, data = self.run_test(
            "Analytics NICB Quality", "GET", "/analytics/nicb-quality",
            params={"feedstock": "calcite", "omega": 5}
        )
        if success and isinstance(data, list):
            print(f"   Found {len(data)} NICB quality records")
            if data:
                sample = data[0]
                print(f"   Sample NICB data: Basin={sample.get('basin', 'N/A')}, Within 5%={sample.get('pct_within_5', 0)}%")
        return success

    def test_states_cdr(self):
        """Test states CDR data"""
        success, data = self.run_test(
            "States CDR", "GET", "/states/cdr",
            params={"feedstock": "calcite", "omega": 5}
        )
        if success and isinstance(data, list):
            print(f"   Found {len(data)} states with CDR data")
        return success

    def test_map_data(self):
        """Test map data"""
        success, data = self.run_test(
            "Map Data", "GET", "/samples/map",
            params={"feedstock": "calcite", "omega": 5}
        )
        if success and isinstance(data, list):
            print(f"   Found {len(data)} map data points")
        return success

    def test_chat_functionality(self):
        """Test AI chat functionality"""
        # Test chat endpoint
        success, response = self.run_test(
            "Chat Message", "POST", "/chat",
            data={"message": "What is the total CDR potential for calcite?", "session_id": "test_session"}
        )
        if success and isinstance(response, dict):
            reply = response.get('reply', '')
            print(f"   Chat response: {reply[:100]}...")
        
        # Test chat history
        history_success, history_data = self.run_test(
            "Chat History", "GET", "/chat/history",
            params={"session_id": "test_session"}
        )
        if history_success and isinstance(history_data, list):
            print(f"   Found {len(history_data)} chat messages")
        
        return success and history_success

def main():
    print("🧪 ERW Dashboard Backend API Testing")
    print("=" * 50)
    
    tester = ERWBackendTester()
    
    # Core API tests
    tests = [
        tester.test_dashboard_overview,
        tester.test_regions_cdr,
        tester.test_samples,
        tester.test_feedstocks,
        tester.test_comparison,
        tester.test_top_rivers,
        tester.test_summary,
        tester.test_filters,
        tester.test_analytics_distributions,
        tester.test_analytics_scatter,
        tester.test_states_cdr,
        tester.test_map_data,
        tester.test_chat_functionality,
    ]
    
    print(f"\nRunning {len(tests)} test suites...")
    
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test suite failed: {e}")
    
    # Print summary
    print("\n" + "=" * 50)
    print(f"📊 RESULTS: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.failures:
        print(f"\n❌ FAILURES ({len(tester.failures)}):")
        for failure in tester.failures:
            error_msg = failure.get('error', f'Status {failure.get("actual", "unknown")}')
            print(f"  • {failure['test']}: {error_msg}")
    
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"\n🎯 Success Rate: {success_rate:.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())