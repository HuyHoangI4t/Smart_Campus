import requests
from bs4 import BeautifulSoup

url = "https://www.ttn.edu.vn/libraries/tnu/kqcq.php"

# Payload chính xác theo đúng cấu trúc bắt được từ DevTools
payload = {
    'msv': '23103023',
    'dk': '10'
}

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://www.ttn.edu.vn/index.php?option=com_tnu&view=kqchinhquy',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'X-Requested-With': 'XMLHttpRequest' # Đánh dấu đây là một request AJAX giống như trình duyệt
}

response = requests.post(url, data=payload, headers=headers, verify=False)

if response.status_code == 200:
    print("=== KẾT QUẢ TRA CỨU THÀNH CÔNG ===\n")
    
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Lấy thông tin tóm tắt (Họ tên, trạng thái sinh viên nếu có)
    info_text = soup.get_text(separator="\n", strip=True)
    
    # Tìm và in tất cả các bảng dữ liệu (học phí, điểm các kỳ)
    tables = soup.find_all('table')
    print(f"Tìm thấy tổng cộng {len(tables)} bảng dữ liệu.\n")
    
    for index, table in enumerate(tables):
        print(f"--- BẢNG THỨ {index + 1} ---")
        rows = table.find_all('tr')
        for row in rows:
            cols = [ele.text.strip() for ele in row.find_all(['td', 'th'])]
            if any(cols):
                print(" | ".join(cols))
        print("\n" + "="*40 + "\n")
else:
    print(f"Lỗi kết nối: {response.status_code}")