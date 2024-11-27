import os

def criar_arquivo_netsettings():
    conteudo = """ipv4
address 192.168.5.100
netmask 255.255.255.0
gateway 192.168.5.254
ipv6
address 2000:abcd:ef01:2345::2
prefix length 64
gateway fe80::1
mac
address a0:b1:c2:d3:e4:f5"""
    with open('netsettings.host.txt', 'w') as f:
        f.write(conteudo)
    print("Arquivo 'netsettings.host.txt' criado.")

def carregar_endereco_host():
    if not os.path.exists('netsettings.host.txt'):
        criar_arquivo_netsettings()
    with open('netsettings.host.txt', 'r') as f:
        endereco_host = f.read().strip().splitlines()
    for linha in endereco_host:
        if "address" in linha and "ipv4" in endereco_host[endereco_host.index(linha) - 1]:
            return linha.split()[1]
    return None

def calcular_checksum(cabeçalho):
    soma = 0
    i = 0
    while i < len(cabeçalho):
        bloco = cabeçalho[i:i+4]
        soma += int(bloco, 16)
        if soma > 0xFFFF:
            soma = (soma & 0xFFFF) + 1
        i += 4
    checksum_final = (~soma) & 0xFFFF
    return format(checksum_final, '04X')

def verificar_integridade(cabeçalho):
    checksum_enviado = cabeçalho[20:24]
    checksum_calculado = calcular_checksum(cabeçalho[:20] + cabeçalho[24:])
    print(f"Checksum enviado: {checksum_enviado}")
    print(f"Checksum calculado: {checksum_calculado}")
    return checksum_enviado == checksum_calculado

def verificar_ip_destino(pacote, endereco_host):
    ip_destino = pacote[32:40]
    ip_destino_formatado = "".join(f"{int(octeto):02X}" for octeto in endereco_host.split('.'))
    return ip_destino == ip_destino_formatado

def entregar_carga_util(protocolo, carga_util):
    pastas = {
        '01': 'ICMP',
        '06': 'TCP',
        '11': 'UDP'
    }
    nomes_arquivos = {
        '01': 'message.txt',
        '06': 'segment.txt',
        '11': 'segment.txt'
    }
    if protocolo in pastas:
        if not os.path.exists(pastas[protocolo]):
            os.mkdir(pastas[protocolo])
        caminho_arquivo = os.path.join(pastas[protocolo], nomes_arquivos[protocolo])
        with open(caminho_arquivo, 'w') as f:
            f.write(carga_util)
        print(f"Carga útil salva no arquivo {caminho_arquivo}.")
    else:
        print("Protocolo não identificado. Pacote descartado.")

def processar_pacote():
    print("Digite o pacote em hexadecimal:")
    pacote = input("Pacote: ").strip().upper()

    if not os.path.exists('IP'):
        os.mkdir('IP')
    caminho_pacote = 'IP/rpacket.txt'
    with open(caminho_pacote, 'w') as f:
        f.write(pacote)

    endereco_host = carregar_endereco_host()

    print("Verificando versão do IP...")
    versao = pacote[0]

    if versao == '6':
        print("Pacote IPv6. Descartado.")
        os.remove(caminho_pacote)
        return
    elif versao == '4':
        print("Pacote IPv4. Verificando integridade.")
        if not verificar_integridade(pacote):
            print("Cabeçalho com erro. Pacote descartado.")
            os.remove(caminho_pacote)
            return
        print("Pacote íntegro. Verificando IP de destino.")
        if not verificar_ip_destino(pacote, endereco_host):
            print("IP de destino não bate. Pacote descartado.")
            os.remove(caminho_pacote)
            return
        print("IP de destino correto. Verificando protocolo.")
        protocolo = pacote[18:20]
        carga_util = pacote[40:]
        entregar_carga_util(protocolo, carga_util)
        print("Pacote processado.")
    else:
        print("Versão de IP inválida. Pacote descartado.")
        os.remove(caminho_pacote)

if __name__ == '__main__':
    processar_pacote()
